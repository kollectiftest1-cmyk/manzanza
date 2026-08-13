"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Container, Row, Col, Card, Button, Badge, Form, Modal,
  Spinner, Alert, Nav, Table, OverlayTrigger, Tooltip
} from "react-bootstrap"
import { useSelector } from "react-redux"
import {
  FiCalendar, FiPlus, FiEdit, FiTrash, FiAlertCircle, FiCheck,
  FiRefreshCw, FiUser, FiGrid, FiClock, FiBookOpen, FiInfo, FiX,
  FiAlertTriangle, FiCopy, FiFilter
} from "react-icons/fi"
import scheduleService from "../services/scheduleService"
import { getUsers } from "../services/userService"
import api from "../services/api"

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
const DAY_KEYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]

const DAY_LABELS = {
  lundi: "Lundi", mardi: "Mardi", mercredi: "Mercredi",
  jeudi: "Jeudi", vendredi: "Vendredi", samedi: "Samedi",
}

const SCHEDULE_TYPES = [
  { value: "normal", label: "Normal (hebdomadaire)" },
  { value: "module", label: "Module (intensif — toute la journée)" },
  { value: "examen", label: "Examen" },
  { value: "rattrapage", label: "Rattrapage" },
]

const AVAILABILITY_TYPES = [
  { value: "disponible", label: "Disponible", color: "success" },
  { value: "indisponible", label: "Indisponible", color: "danger" },
  { value: "prefere", label: "Préféré", color: "primary" },
]

const SCHEDULE_COLORS = {
  normal: { bg: "#e8f4ff", border: "#2196F3", text: "#1565C0", badge: "primary" },
  module: { bg: "#fff3e0", border: "#FF9800", text: "#E65100", badge: "warning" },
  examen: { bg: "#fce4ec", border: "#e91e63", text: "#880e4f", badge: "danger" },
  rattrapage: { bg: "#f3e5f5", border: "#9c27b0", text: "#4a148c", badge: "info" },
  conflict: { bg: "#fff3e0", border: "#FF9800", text: "#E65100" },
}

const EMPTY_SCHEDULE = {
  course: "",
  auditoire: "",
  room: "",
  day_of_week: "",
  timeslot: "",
  start_time: "",
  end_time: "",
  teacher: "",
  schedule_type: "normal",
  module_start_date: "",
  module_end_date: "",
  module_start_time: "",
  module_end_time: "",
  term: "",
  description: "",
  // Tronc commun
  is_tronc_commun: false,
  extra_auditoires: [],
}

const EMPTY_AVAILABILITY = {
  day_of_week: "",
  timeslot: "",
  availability_type: "disponible",
  start_date: "",
  end_date: "",
  reason: "",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isAdminOrSGA = (role) =>
  ["iadmin", "sga", "pdg", "directeur_general", "sgad"].includes(role)

const isTeacher = (role) =>
  ["enseignant", "assistant", "chef_section", "chef_departement"].includes(role)

/**
 * Group schedules into a grid-friendly map: key = "day__startTime-endTime"
 * For normal/examen/rattrapage schedules uses day_of_week + start_time/end_time;
 * modules go in a separate list.
 */
const groupByDayAndPeriod = (schedules) => {
  const map = {}
  const modules = []
  schedules.forEach((s) => {
    if (s.schedule_type === "module") {
      modules.push(s)
      return
    }
    const dayKey = s.day_of_week
    if (!dayKey || !s.start_time || !s.end_time) return
    const rangeKey = `${s.start_time}-${s.end_time}`
    const key = `${dayKey}__${rangeKey}`
    if (!map[key]) map[key] = []
    map[key].push(s)
  })
  return { map, modules }
}

/**
 * Get unique time ranges from schedules (not timeslots).
 * Derives grid rows from actual scheduled start_time/end_time pairs.
 */
const getUniqueTimeRanges = (schedules) => {
  const seen = new Set()
  const ranges = []
  schedules.forEach((s) => {
    if (s.schedule_type === "module" || !s.start_time || !s.end_time) return
    const key = `${s.start_time}-${s.end_time}`
    if (!seen.has(key)) {
      seen.add(key)
      ranges.push({
        start_time: s.start_time,
        end_time: s.end_time,
        display: `${s.start_time?.slice(0, 5)} – ${s.end_time?.slice(0, 5)}`,
        label: null,
      })
    }
  })
  ranges.sort((a, b) => a.start_time.localeCompare(b.start_time))
  return ranges
}

/**
 * Detect teacher conflicts across auditoires at the same day+period.
 */
const detectTeacherConflicts = (schedules) => {
  const teacherSlotMap = {}
  schedules.forEach((s) => {
    if (!s.teacher || s.schedule_type === "module") return
    if (!s.day_of_week || !s.start_time || !s.end_time) return
    const key = `${s.teacher}__${s.day_of_week}__${s.start_time}-${s.end_time}`
    if (!teacherSlotMap[key]) {
      teacherSlotMap[key] = {
        teacherId: s.teacher,
        teacherName: s.teacher_name,
        day: s.day_of_week,
        timeRange: `${s.start_time?.slice(0, 5)}-${s.end_time?.slice(0, 5)}`,
        entries: [],
      }
    }
    teacherSlotMap[key].entries.push(s)
  })
  return Object.values(teacherSlotMap)
    .filter((g) => {
      const uniqueAuditoires = new Set(g.entries.map((e) => e.auditoire))
      return uniqueAuditoires.size > 1
    })
    .map((g) => ({
      ...g,
      auditoires: [...new Set(g.entries.map((e) => e.auditoire_name || e.auditoire))],
      courses: g.entries.map((e) => e.course_name || e.course),
    }))
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const ScheduleCell = ({ entries, onEdit, onDelete, canManage, teacherConflictIds }) => {
  if (!entries || entries.length === 0) return null
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {entries.map((s) => {
        const hasTeacherConflict = teacherConflictIds?.has(s.id)
        const colors = hasTeacherConflict
          ? SCHEDULE_COLORS.conflict
          : (SCHEDULE_COLORS[s.schedule_type] || SCHEDULE_COLORS.normal)
        return (
          <div
            key={s.id}
            style={{
              background: hasTeacherConflict ? "#fff8e1" : colors.bg,
              borderLeft: `4px solid ${hasTeacherConflict ? "#FF9800" : colors.border}`,
              borderRadius: 6,
              padding: "6px 8px",
              fontSize: "0.78rem",
              position: "relative",
            }}
          >
            <div style={{ fontWeight: 700, color: colors.text, marginBottom: 2 }}>
              {s.course_name || s.course}
            </div>
            <div style={{ color: "#555" }}>
              {s.teacher_name && <span><FiUser size={11} /> {s.teacher_name}</span>}
            </div>
            {s.room_name && <div style={{ color: "#888", fontSize: "0.72rem" }}>Salle: {s.room_name}</div>}
            {s.auditoire_name && <div style={{ color: "#888", fontSize: "0.72rem" }}>{s.auditoire_name}</div>}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <Badge bg={colors.badge} style={{ fontSize: "0.65rem" }}>
                {SCHEDULE_TYPES.find(t => t.value === s.schedule_type)?.label?.toUpperCase() || s.schedule_type?.toUpperCase() || "NORMAL"}
              </Badge>
              {hasTeacherConflict && (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>L'enseignant a un autre cours au même créneau dans un autre auditoire</Tooltip>}
                >
                  <Badge bg="warning" text="dark" style={{ fontSize: "0.65rem", cursor: "help" }}>
                    <FiAlertTriangle size={10} /> Chevauchement
                  </Badge>
                </OverlayTrigger>
              )}
            </div>
            {canManage && (
              <div style={{ position: "absolute", top: 4, right: 4, display: "flex", gap: 3 }}>
                <Button
                  size="sm"
                  variant="link"
                  style={{ padding: 2, color: "#FF9800" }}
                  onClick={() => onEdit(s)}
                >
                  <FiEdit size={12} />
                </Button>
                <Button
                  size="sm"
                  variant="link"
                  style={{ padding: 2, color: "#f44336" }}
                  onClick={() => onDelete(s)}
                >
                  <FiTrash size={12} />
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Horaire = () => {
  const { user } = useSelector((state) => state.auth)
  const role = user?.role

  // ── State
  const [activeTab, setActiveTab] = useState(
    isAdminOrSGA(user?.role) ? "tous" : "mon-horaire"
  )
  const [schedules, setSchedules] = useState([])
  const [timeslots, setTimeslots] = useState([])
  const [rooms, setRooms] = useState([])
  const [auditoires, setAuditoires] = useState([])
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [myAvailability, setMyAvailability] = useState([])

  const [selectedAuditoire, setSelectedAuditoire] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState("")
  const [terms, setTerms] = useState([])
  const [selectedTerm, setSelectedTerm] = useState("")

  // Academic calendar context
  const [calendarCtx, setCalendarCtx] = useState(null) // from /calendar-context endpoint

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [scheduleForm, setScheduleForm] = useState(EMPTY_SCHEDULE)
  const [formError, setFormError] = useState(null)
  const [formWarnings, setFormWarnings] = useState([])

  // Availability modal
  const [showAvailModal, setShowAvailModal] = useState(false)
  const [editingAvail, setEditingAvail] = useState(null)
  const [availForm, setAvailForm] = useState(EMPTY_AVAILABILITY)

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const canManage = isAdminOrSGA(role) || ['chef_departement', 'chef_section'].includes(role)
  const iAmTeacher = isTeacher(role)

  // ── Derived: vacation type of selected auditoire in the form
  const selectedAuditoireVacation = useMemo(() => {
    if (!scheduleForm.auditoire) return null
    const aud = auditoires.find((a) => String(a.id) === String(scheduleForm.auditoire))
    return aud?.vacation || null
  }, [scheduleForm.auditoire, auditoires])

  // ── Derived: periods filtered by auditoire vacation type
  const availablePeriods = useMemo(() => {
    if (!selectedAuditoireVacation) return timeslots
    return timeslots.filter((ts) => ts.vacation_type === selectedAuditoireVacation)
  }, [timeslots, selectedAuditoireVacation])

  // ── Derived: unique time ranges for grid rows (from ALL timeslots, or filtered)
  const uniqueTimeRanges = useMemo(() => getUniqueTimeRanges(schedules), [schedules])

  // ── Derived: grid mapping and teacher conflicts
  const { map: gridMap, modules: moduleSchedules } = useMemo(
    () => groupByDayAndPeriod(schedules), [schedules]
  )
  const teacherConflicts = useMemo(() => detectTeacherConflicts(schedules), [schedules])
  const teacherConflictIds = useMemo(() => {
    const ids = new Set()
    teacherConflicts.forEach((c) => c.entries?.forEach((e) => ids.add(e.id)))
    return ids
  }, [teacherConflicts])

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadTimeslotsAndRooms = useCallback(async () => {
    const [ts, rs] = await Promise.all([
      scheduleService.getTimeslots(),
      scheduleService.getRooms(),
    ])
    setTimeslots(Array.isArray(ts) ? ts : ts.results || [])
    setRooms(Array.isArray(rs) ? rs : rs.results || [])
  }, [])

  const loadMySchedule = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (selectedTerm) params.term = selectedTerm
      const data = await scheduleService.getMySchedule(params)
      setSchedules(Array.isArray(data) ? data : data.results || [])
    } catch (e) {
      setError("Impossible de charger votre horaire.")
    } finally {
      setLoading(false)
    }
  }, [selectedTerm])

  const loadAuditoireSchedule = useCallback(async (audId) => {
    if (!audId) return
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (selectedTerm) params.term = selectedTerm
      const data = await scheduleService.getAuditoireSchedule(audId, params)
      setSchedules(Array.isArray(data) ? data : data.results || [])
    } catch (e) {
      setError("Impossible de charger l'horaire de cet auditoire.")
    } finally {
      setLoading(false)
    }
  }, [selectedTerm])

  const loadTeacherSchedule = useCallback(async (tid) => {
    if (!tid) return
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (selectedTerm) params.term = selectedTerm
      const data = await scheduleService.getTeacherSchedule(tid, params)
      setSchedules(Array.isArray(data) ? data : data.results || [])
    } catch (e) {
      setError("Impossible de charger l'horaire du professeur.")
    } finally {
      setLoading(false)
    }
  }, [selectedTerm])

  const loadAllSchedules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (selectedTerm) params.term = selectedTerm
      const data = await scheduleService.getSchedules(params)
      setSchedules(Array.isArray(data) ? data : data.results || [])
    } catch (e) {
      setError("Impossible de charger les horaires.")
    } finally {
      setLoading(false)
    }
  }, [selectedTerm])

  const loadMyAvailability = useCallback(async () => {
    try {
      const data = await scheduleService.getMyAvailability()
      setMyAvailability(Array.isArray(data) ? data : data.results || [])
    } catch { /* non-critical */ }
  }, [])

  const loadSupportData = useCallback(async () => {
    try {
      const [audRes, coursRes, teachRes, assistRes, termsRes] = await Promise.all([
        api.get("/auditoires/"),
        api.get("/courses/"),
        getUsers({ role: "enseignant" }),
        getUsers({ role: "assistant" }),
        scheduleService.getTerms().catch(() => []),
      ])
      setAuditoires(
        Array.isArray(audRes.data) ? audRes.data : audRes.data.results || []
      )
      setCourses(
        Array.isArray(coursRes.data) ? coursRes.data : coursRes.data.results || []
      )
      // FIX: getUsers returns Axios response, extract .data first
      const teachData = teachRes?.data || teachRes
      const assistData = assistRes?.data || assistRes
      const teachArr = Array.isArray(teachData) ? teachData : teachData?.results || []
      const assistArr = Array.isArray(assistData) ? assistData : assistData?.results || []
      setTeachers([...teachArr, ...assistArr])
      // Terms
      const termsArr = Array.isArray(termsRes) ? termsRes : termsRes?.results || []
      setTerms(termsArr)
    } catch { /* support data load failure is non-critical */ }
  }, [])

  const loadCalendarContext = useCallback(async () => {
    try {
      const ctx = await scheduleService.getCalendarContext()
      setCalendarCtx(ctx)
    } catch { /* non-critical */ }
  }, [])

  // ── Initialisation ────────────────────────────────────────────────────────

  useEffect(() => {
    loadTimeslotsAndRooms()
    loadCalendarContext()
    if (canManage) loadSupportData()
    if (iAmTeacher) loadMyAvailability()
  }, []) // eslint-disable-line

  useEffect(() => {
    if (activeTab === "mon-horaire") {
      loadMySchedule()
    } else if (activeTab === "par-auditoire") {
      if (selectedAuditoire) loadAuditoireSchedule(selectedAuditoire)
      else { setSchedules([]); setLoading(false) }
    } else if (activeTab === "par-enseignant") {
      if (selectedTeacher) loadTeacherSchedule(selectedTeacher)
      else { setSchedules([]); setLoading(false) }
    } else if (activeTab === "tous") {
      loadAllSchedules()
    } else if (activeTab === "disponibilite") {
      loadMyAvailability()
      setLoading(false)
    }
  }, [activeTab, selectedAuditoire, selectedTeacher, selectedTerm]) // eslint-disable-line

  // ── Handlers: Course selection auto-fill ───────────────────────────────────

  const handleCourseChange = (courseId) => {
    const selected = courses.find((c) => String(c.id) === String(courseId))
    const newForm = { ...scheduleForm, course: courseId }

    if (selected) {
      // Auto-fill auditoire from course
      if (selected.auditoire) {
        newForm.auditoire = String(selected.auditoire)
      }
      // Auto-fill teacher from course titulaire
      if (selected.titulaire) {
        newForm.teacher = String(selected.titulaire)
      }
      // Auto-resolve term from course semester
      if (selected.semester && terms.length > 0) {
        const semesterNames = selected.semester.split(',').map(s => s.trim()).filter(Boolean)
        if (semesterNames.length === 1) {
          const matchTerm = terms.find(t => t.name === semesterNames[0])
          if (matchTerm) newForm.term = String(matchTerm.id)
        } else if (semesterNames.length > 1) {
          // Prefer active term if it matches
          const activeTerm = calendarCtx?.active_term
          if (activeTerm && semesterNames.includes(activeTerm.name)) {
            newForm.term = String(activeTerm.id)
          } else {
            const firstMatch = terms.find(t => semesterNames.includes(t.name))
            if (firstMatch) newForm.term = String(firstMatch.id)
          }
        }
      }
    } else {
      newForm.auditoire = ""
      newForm.teacher = ""
      newForm.term = ""
    }
    setScheduleForm(newForm)
  }

  // ── Handlers: Schedule CRUD ───────────────────────────────────────────────

  const openCreateSchedule = () => {
    setEditingSchedule(null)
    setScheduleForm(EMPTY_SCHEDULE)
    setFormError(null)
    setFormWarnings([])
    setShowScheduleModal(true)
  }

  const openEditSchedule = (s) => {
    setEditingSchedule(s)
    setScheduleForm({
      course: s.course ?? "",
      auditoire: s.auditoire ?? "",
      room: s.room ?? "",
      day_of_week: s.day_of_week ?? "",
      timeslot: typeof s.timeslot === "object" ? s.timeslot?.id || "" : s.timeslot ?? "",
      teacher: s.teacher ?? "",
      schedule_type: s.schedule_type ?? "normal",
      start_time: s.start_time ?? "",
      end_time: s.end_time ?? "",
      module_start_date: s.module_start_date ?? "",
      module_end_date: s.module_end_date ?? "",
      module_start_time: s.module_start_time ?? "",
      module_end_time: s.module_end_time ?? "",
      term: s.term ?? "",
      description: s.description ?? "",
      is_tronc_commun: false,
      extra_auditoires: [],
    })
    setFormError(null)
    setFormWarnings([])
    setShowScheduleModal(true)
  }

  const handleSaveSchedule = async () => {
    setFormError(null)
    setFormWarnings([])

    const isModule = scheduleForm.schedule_type === "module"

    // Validation
    if (!scheduleForm.course || !scheduleForm.auditoire) {
      setFormError("Le cours et l'auditoire sont obligatoires.")
      return
    }
    if (!isModule && (!scheduleForm.day_of_week || !scheduleForm.start_time || !scheduleForm.end_time)) {
      setFormError("Le jour, l'heure de début et l'heure de fin sont obligatoires.")
      return
    }
    if (!isModule && scheduleForm.start_time >= scheduleForm.end_time) {
      setFormError("L'heure de début doit être avant l'heure de fin.")
      return
    }
    if (isModule && (!scheduleForm.module_start_date || !scheduleForm.module_end_date)) {
      setFormError("Les dates de début et fin sont obligatoires pour un module.")
      return
    }

    // ── Calendar-aware warnings ────────────────────────────────────────────
    const calWarnings = []
    if (calendarCtx?.has_calendar) {
      const termId = scheduleForm.term
      const selectedTermObj = termId
        ? (calendarCtx.terms || []).find(t => String(t.id) === String(termId))
        : calendarCtx.active_term

      if (isModule && selectedTermObj) {
        const mStart = scheduleForm.module_start_date
        const mEnd = scheduleForm.module_end_date
        const courseEnd = selectedTermObj.end_courses_date || selectedTermObj.end_date
        if (mStart < selectedTermObj.start_date || mEnd > courseEnd) {
          calWarnings.push(
            `⚠️ Ce module (${mStart} → ${mEnd}) dépasse la période de cours du ${selectedTermObj.name} (${selectedTermObj.start_date} → ${courseEnd}).`
          )
        }
        // Check overlap with vacations/holidays
        for (const ev of (calendarCtx.events || [])) {
          if (['vacance', 'ferie'].includes(ev.event_type)) {
            if (mStart <= ev.end_date && mEnd >= ev.start_date) {
              calWarnings.push(`📅 Ce module chevauche "${ev.name}" (${ev.start_date} → ${ev.end_date}).`)
            }
          }
        }
      }

      // For normal schedules, check if current period has active vacation/holiday
      if (!isModule && calendarCtx.today_flags?.length > 0) {
        for (const flag of calendarCtx.today_flags) {
          if (['vacance', 'ferie'].includes(flag.type)) {
            calWarnings.push(`📅 Actuellement en période "${flag.name}". Les cours sont probablement suspendus.`)
          }
        }
      }

      // Warn if no calendar exists
      if (!calendarCtx.has_calendar) {
        calWarnings.push("⚠️ Aucun calendrier académique configuré. Il est recommandé de créer d'abord le calendrier.")
      }
    }

    if (calWarnings.length > 0) {
      setFormWarnings(calWarnings)
    }

    setSaving(true)
    try {
      const { is_tronc_commun, extra_auditoires, ...payload } = { ...scheduleForm }

      // For module: don't send day/time fields
      if (isModule) {
        delete payload.day_of_week
        delete payload.timeslot
        delete payload.start_time
        delete payload.end_time
      } else {
        // For non-module: don't send module date fields
        delete payload.module_start_date
        delete payload.module_end_date
        delete payload.module_start_time
        delete payload.module_end_time
      }

      // Remove empty optional fields
      if (!payload.room) delete payload.room
      if (!payload.teacher) delete payload.teacher
      if (!payload.term) delete payload.term
      if (!payload.timeslot) delete payload.timeslot
      if (!payload.description) delete payload.description

      if (editingSchedule) {
        await scheduleService.updateSchedule(editingSchedule.id, payload)
      } else {
        await scheduleService.createSchedule(payload)

        // Tronc commun
        if (is_tronc_commun && extra_auditoires.length > 0) {
          const extraPromises = extra_auditoires.map((audId) => {
            const extraPayload = { ...payload, auditoire: audId }
            return scheduleService.createSchedule(extraPayload).catch(() => null)
          })
          const results = await Promise.allSettled(extraPromises)
          const failed = results.filter((r) => r.status === "rejected" || r.value === null)
          if (failed.length > 0) {
            setFormWarnings([`${failed.length} auditoire(s) supplémentaire(s) n'ont pas pu être ajoutés (conflit possible).`])
          }
        }
      }
      setShowScheduleModal(false)
      if (activeTab === "tous") loadAllSchedules()
      else if (activeTab === "par-auditoire") loadAuditoireSchedule(selectedAuditoire)
      else if (activeTab === "par-enseignant") loadTeacherSchedule(selectedTeacher)
      else loadMySchedule()
    } catch (e) {
      const msg = e.response?.data
      if (msg && typeof msg === "object") {
        if (msg.conflicts) {
          const conflicts = Array.isArray(msg.conflicts) ? msg.conflicts : [msg.conflicts]
          setFormError(conflicts.join(" | "))
        } else {
          const first = Object.values(msg)[0]
          setFormError(Array.isArray(first) ? first[0] : JSON.stringify(msg))
        }
      } else {
        setFormError("Erreur lors de la sauvegarde. Vérifiez les conflits d'horaire.")
      }
    } finally {
      setSaving(false)
    }
  }

  const openDeleteSchedule = (s) => {
    setToDelete(s)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!toDelete) return
    setSaving(true)
    try {
      await scheduleService.deleteSchedule(toDelete.id)
      setShowDeleteModal(false)
      setToDelete(null)
      if (activeTab === "tous") loadAllSchedules()
      else if (activeTab === "par-auditoire") loadAuditoireSchedule(selectedAuditoire)
      else if (activeTab === "par-enseignant") loadTeacherSchedule(selectedTeacher)
      else loadMySchedule()
    } catch { /* fail silently */ }
    finally { setSaving(false) }
  }

  // ── Handlers: Teacher Availability CRUD ──────────────────────────────────

  const openCreateAvail = () => {
    setEditingAvail(null)
    setAvailForm(EMPTY_AVAILABILITY)
    setShowAvailModal(true)
  }

  const openEditAvail = (a) => {
    setEditingAvail(a)
    setAvailForm({
      day_of_week: a.day_of_week ?? "",
      timeslot: a.timeslot ?? "",
      availability_type: a.availability_type ?? "disponible",
      start_date: a.start_date ?? "",
      end_date: a.end_date ?? "",
      reason: a.reason ?? "",
    })
    setShowAvailModal(true)
  }

  const handleSaveAvail = async () => {
    setSaving(true)
    try {
      const payload = { ...availForm }
      if (!payload.start_date) delete payload.start_date
      if (!payload.end_date) delete payload.end_date
      if (editingAvail) {
        await scheduleService.updateAvailability(editingAvail.id, payload)
      } else {
        await scheduleService.createAvailability(payload)
      }
      setShowAvailModal(false)
      loadMyAvailability()
    } catch (e) {
      alert("Erreur lors de la sauvegarde de la disponibilité.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAvail = async (id) => {
    if (!window.confirm("Supprimer cette disponibilité ?")) return
    await scheduleService.deleteAvailability(id)
    loadMyAvailability()
  }

  // ── Publish schedule for an auditoire ─────────────────────────────────────
  const [publishingSchedule, setPublishingSchedule] = useState(false)

  const handlePublishSchedule = async () => {
    if (!selectedAuditoire) return
    const aud = auditoires.find(a => String(a.id) === String(selectedAuditoire))
    if (!window.confirm(
      `Publier l'horaire de ${aud?.nom || 'cet auditoire'} ?\n\n` +
      `Les étudiants, enseignants, assistants, chef de section et chef de département ` +
      `concernés recevront une notification.`
    )) return
    try {
      setPublishingSchedule(true)
      const payload = { auditoire_id: selectedAuditoire }
      if (selectedTerm) payload.term_id = selectedTerm
      const result = await scheduleService.publishSchedule(payload)
      setError(null)
      alert(`✅ ${result.message}\n${result.notifications_sent} notification(s) envoyée(s).`)
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors de la publication de l'horaire.")
    } finally {
      setPublishingSchedule(false)
    }
  }

  // ── Render: Weekly grid ───────────────────────────────────────────────────

  const renderGrid = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Chargement de l'horaire…</p>
        </div>
      )
    }
    if (error) {
      return <Alert variant="danger"><FiAlertCircle /> {error}</Alert>
    }
    if (schedules.length === 0) {
      return (
        <div className="text-center py-5 text-muted">
          <FiCalendar size={48} style={{ opacity: 0.3 }} />
          <p className="mt-3">Aucun cours dans l'horaire.</p>
        </div>
      )
    }

    return (
      <div style={{ overflowX: "auto" }}>
        {/* Teacher conflict warnings banner */}
        {teacherConflicts.length > 0 && (
          <Alert variant="warning" className="mb-3">
            <FiAlertTriangle className="me-2" />
            <strong>Chevauchements détectés :</strong>{" "}
            {teacherConflicts.map((c, i) => (
              <span key={i}>
                {c.teacherName} a {c.entries.length} cours en même temps ({DAY_LABELS[c.day] || c.day} {c.timeRange})
                {i < teacherConflicts.length - 1 ? " | " : ""}
              </span>
            ))}
          </Alert>
        )}

        {/* Normal schedules grid */}
        <Table bordered hover style={{ fontSize: "0.82rem", minWidth: 700 }}>
          <thead style={{ background: "var(--color-primary, #2563eb)", color: "#fff" }}>
            <tr>
              <th style={{ width: 140 }}>Période</th>
              {DAYS.map((d) => (
                <th key={d} className="text-center">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uniqueTimeRanges.map((range) => (
              <tr key={`${range.start_time}-${range.end_time}`}>
                <td style={{ verticalAlign: "middle", background: "#f8f9fa", fontWeight: 600 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{range.label || range.display}</div>
                  <div style={{ fontSize: "0.7rem", color: "#888" }}>
                    {range.start_time?.slice(0, 5)} – {range.end_time?.slice(0, 5)}
                  </div>
                </td>
                {DAY_KEYS.map((day) => {
                  const key = `${day}__${range.start_time}-${range.end_time}`
                  const entries = gridMap[key]
                  return (
                    <td key={day} style={{ verticalAlign: "top", minHeight: 60 }}>
                      <ScheduleCell
                        entries={entries}
                        onEdit={openEditSchedule}
                        onDelete={openDeleteSchedule}
                        canManage={canManage}
                        teacherConflictIds={teacherConflictIds}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Module schedules (date-based, shown below the grid) */}
        {moduleSchedules.length > 0 && (
          <Card className="mt-3 border-warning">
            <Card.Header className="bg-warning bg-opacity-10 text-dark">
              <FiClock className="me-2" />
              <strong>Cours en module (intensifs)</strong>
            </Card.Header>
            <Card.Body>
              <Table hover size="sm" style={{ fontSize: "0.82rem" }}>
                <thead>
                  <tr>
                    <th>Cours</th>
                    <th>Auditoire</th>
                    <th>Enseignant</th>
                    <th>Du</th>
                    <th>Au</th>
                    <th>Salle</th>
                    {canManage && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {moduleSchedules.map((s) => {
                    // Calendar validation for this module
                    const moduleWarnings = []
                    if (calendarCtx?.has_calendar && s.module_start_date && s.module_end_date) {
                      const termObj = s.term
                        ? (calendarCtx.terms || []).find(t => String(t.id) === String(s.term))
                        : calendarCtx.active_term
                      if (termObj) {
                        const courseEnd = termObj.end_courses_date || termObj.end_date
                        if (s.module_start_date < termObj.start_date || s.module_end_date > courseEnd) {
                          moduleWarnings.push("Hors période de cours")
                        }
                      }
                      for (const ev of (calendarCtx.events || [])) {
                        if (['vacance', 'ferie'].includes(ev.event_type) &&
                            s.module_start_date <= ev.end_date && s.module_end_date >= ev.start_date) {
                          moduleWarnings.push(ev.name)
                        }
                      }
                    }

                    return (
                    <tr key={s.id} className={moduleWarnings.length > 0 ? 'table-warning' : ''}>
                      <td>
                        <strong>{s.course_name || s.course}</strong>
                        {moduleWarnings.length > 0 && (
                          <div style={{ fontSize: '0.72rem' }}>
                            {moduleWarnings.map((w, i) => (
                              <Badge key={i} bg="warning" text="dark" className="me-1 mb-1" style={{ fontWeight: 400 }}>
                                <FiAlertTriangle size={10} className="me-1" />{w}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>{s.auditoire_name || "—"}</td>
                      <td>{s.teacher_name || "—"}</td>
                      <td>{s.module_start_date || "—"}</td>
                      <td>{s.module_end_date || "—"}</td>
                      <td>{s.room_name || "—"}</td>
                      {canManage && (
                        <td>
                          <Button variant="link" size="sm" style={{ color: "#FF9800" }} onClick={() => openEditSchedule(s)}>
                            <FiEdit size={14} />
                          </Button>
                          <Button variant="link" size="sm" style={{ color: "#f44336" }} onClick={() => openDeleteSchedule(s)}>
                            <FiTrash size={14} />
                          </Button>
                        </td>
                      )}
                    </tr>
                    )
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}
      </div>
    )
  }

  // ── Render: Tabs ─────────────────────────────────────────────────────────

  const tabs = []
  tabs.push({ key: "mon-horaire", label: "Mon Horaire", icon: <FiCalendar /> })
  if (canManage) {
    tabs.push({ key: "par-auditoire", label: "Par Auditoire", icon: <FiGrid /> })
    tabs.push({ key: "par-enseignant", label: "Par Enseignant", icon: <FiUser /> })
    tabs.push({ key: "tous", label: "Tous les Horaires", icon: <FiBookOpen /> })
  }
  if (iAmTeacher) {
    tabs.push({ key: "disponibilite", label: "Mes Disponibilités", icon: <FiCheck /> })
  }

  // ── Determine if the form is for a module (no day/period needed)
  const isModuleForm = scheduleForm.schedule_type === "module"

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Container fluid className="py-4 px-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <FiCalendar size={24} style={{ color: "var(--color-primary, #2563eb)" }} />
            Horaires
          </h3>
          <small className="text-muted">Emploi du temps par auditoire et par enseignant</small>
        </div>
        {canManage && (
          <Button
            variant="primary"
            onClick={openCreateSchedule}
            className="d-flex align-items-center gap-2"
          >
            <FiPlus /> Nouveau Créneau
          </Button>
        )}
      </div>

      {/* Calendar context banner */}
      {calendarCtx && calendarCtx.has_calendar && (
        <div className="mb-3 p-3 rounded d-flex align-items-center flex-wrap gap-2"
          style={{ backgroundColor: '#f0f4ff', border: '1px solid #d0d7f0', fontSize: '0.85rem' }}>
          <FiCalendar className="text-primary flex-shrink-0" />
          <span className="fw-semibold">{calendarCtx.academic_year?.name}</span>
          {calendarCtx.active_term && (
            <Badge bg="primary" className="ms-1">{calendarCtx.active_term.name}</Badge>
          )}
          {calendarCtx.today_flags?.map((f, i) => (
            <Badge key={i} style={{ backgroundColor: f.color || '#6c757d' }} className="ms-1">
              {f.name}
            </Badge>
          ))}
          {!calendarCtx.active_term && (
            <span className="text-muted ms-1">Aucun trimestre actif</span>
          )}
        </div>
      )}
      {calendarCtx && !calendarCtx.has_calendar && canManage && (
        <Alert variant="warning" className="d-flex align-items-center gap-2 py-2" style={{ fontSize: '0.85rem' }}>
          <FiAlertTriangle />
          Aucun calendrier académique configuré. <a href="/calendrier" className="fw-semibold">Créer un calendrier</a> pour activer la validation des périodes de cours.
        </Alert>
      )}

      {/* Filtre par trimestre/semestre */}
      {terms.length > 0 && (
        <Card className="mb-3 border-0 shadow-sm">
          <Card.Body className="d-flex align-items-center gap-3 py-2 flex-wrap">
            <FiFilter size={16} className="text-primary" />
            <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>Filtrer par :</span>
            <Form.Select
              style={{ maxWidth: 250 }}
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="">Tous les trimestres</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.term_type_display ? `(${t.term_type_display})` : ""}
                </option>
              ))}
            </Form.Select>
            {selectedTerm && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setSelectedTerm("")}
              >
                <FiX size={14} className="me-1" /> Réinitialiser
              </Button>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Tabs */}
      <Nav variant="tabs" className="mb-3">
        {tabs.map((t) => (
          <Nav.Item key={t.key}>
            <Nav.Link
              active={activeTab === t.key}
              onClick={() => setActiveTab(t.key)}
              style={{ cursor: "pointer" }}
            >
              <span className="me-1">{t.icon}</span> {t.label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {/* Tab content */}
      {activeTab === "par-auditoire" && (
        <Card className="mb-3 border-0 shadow-sm">
          <Card.Body className="d-flex align-items-center gap-3 py-2 flex-wrap">
            <FiGrid />
            <Form.Select
              style={{ maxWidth: 300 }}
              value={selectedAuditoire}
              onChange={(e) => setSelectedAuditoire(e.target.value)}
            >
              <option value="">— Sélectionner un auditoire —</option>
              {auditoires.map((a) => (
                <option key={a.id} value={a.id}>{a.nom}</option>
              ))}
            </Form.Select>
            {isAdminOrSGA(role) && selectedAuditoire && (
              <Button
                variant="success"
                size="sm"
                onClick={handlePublishSchedule}
                disabled={publishingSchedule || schedules.length === 0}
              >
                {publishingSchedule ? (
                  <><Spinner size="sm" animation="border" className="me-1" /> Publication…</>
                ) : (
                  <><FiCheck className="me-1" /> Publier l'horaire</>
                )}
              </Button>
            )}
          </Card.Body>
        </Card>
      )}

      {activeTab === "par-enseignant" && (
        <Card className="mb-3 border-0 shadow-sm">
          <Card.Body className="d-flex align-items-center gap-3 py-2">
            <FiUser />
            <Form.Select
              style={{ maxWidth: 300 }}
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              <option value="">— Sélectionner un enseignant —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name}
                </option>
              ))}
            </Form.Select>
          </Card.Body>
        </Card>
      )}

      {/* Grille principal */}
      {activeTab !== "disponibilite" && (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            {renderGrid()}
          </Card.Body>
        </Card>
      )}

      {/* Disponibilités enseignant */}
      {activeTab === "disponibilite" && (
        <Card className="border-0 shadow-sm">
          <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom">
            <strong><FiClock className="me-2" />Mes Disponibilités</strong>
            <Button size="sm" variant="primary" onClick={openCreateAvail}>
              <FiPlus /> Ajouter
            </Button>
          </Card.Header>
          <Card.Body>
            {myAvailability.length === 0 ? (
              <p className="text-muted text-center py-4">
                Aucune disponibilité déclarée. Cliquez sur "Ajouter" pour commencer.
              </p>
            ) : (
              <Table hover size="sm">
                <thead>
                  <tr>
                    <th>Jour</th>
                    <th>Période</th>
                    <th>Type</th>
                    <th>Du</th>
                    <th>Au</th>
                    <th>Raison</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {myAvailability.map((a) => {
                    const at = AVAILABILITY_TYPES.find((x) => x.value === a.availability_type)
                    const ts = timeslots.find((t) => t.id === a.timeslot)
                    return (
                      <tr key={a.id}>
                        <td>{a.day_display || DAY_LABELS[a.day_of_week] || a.day_of_week || "—"}</td>
                        <td>{ts ? `${ts.label} (${ts.start_time?.slice(0, 5)}–${ts.end_time?.slice(0, 5)})` : "—"}</td>
                        <td>
                          <Badge bg={at?.color || "secondary"}>{at?.label || a.availability_type}</Badge>
                        </td>
                        <td>{a.start_date || "—"}</td>
                        <td>{a.end_date || "—"}</td>
                        <td>{a.reason || "—"}</td>
                        <td>
                          <Button variant="link" size="sm" style={{ color: "#FF9800" }} onClick={() => openEditAvail(a)}>
                            <FiEdit />
                          </Button>
                          <Button variant="link" size="sm" style={{ color: "#f44336" }} onClick={() => handleDeleteAvail(a.id)}>
                            <FiTrash />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      {/* ── Schedule Create/Edit Modal ──────────────────────────────────── */}
      <Modal show={showScheduleModal} onHide={() => setShowScheduleModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingSchedule ? "Modifier le créneau" : "Planifier un cours"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger"><FiAlertCircle /> {formError}</Alert>}
          {formWarnings.length > 0 && (
            <Alert variant="warning">
              <FiAlertTriangle className="me-1" />
              {formWarnings.map((w, i) => <div key={i}>{w}</div>)}
            </Alert>
          )}
          <Row className="g-3">
            {/* ── Type: Normal ou Module ── */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">Type d'horaire *</Form.Label>
                <div className="d-flex gap-3">
                  {SCHEDULE_TYPES.map((t) => (
                    <Form.Check
                      key={t.value}
                      type="radio"
                      id={`schedule-type-${t.value}`}
                      name="schedule_type"
                      label={t.label}
                      checked={scheduleForm.schedule_type === t.value}
                      onChange={() => setScheduleForm({
                        ...scheduleForm,
                        schedule_type: t.value,
                        // Reset day/times when switching to module
                        ...(t.value === "module" ? { day_of_week: "", timeslot: "", start_time: "", end_time: "" } : {}),
                        // Reset dates when switching to non-module
                        ...(t.value !== "module" ? { module_start_date: "", module_end_date: "" } : {}),
                      })}
                    />
                  ))}
                </div>
              </Form.Group>
            </Col>

            {/* ── Cours ── */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">Cours *</Form.Label>
                <Form.Select
                  value={scheduleForm.course}
                  onChange={(e) => handleCourseChange(e.target.value)}
                >
                  <option value="">— Sélectionner un cours —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.titre || c.nom} {c.code ? `(${c.code})` : ""}
                    </option>
                  ))}
                </Form.Select>
                {scheduleForm.course && (
                  <Form.Text className="text-success">
                    <FiCheck size={11} className="me-1" />
                    L'auditoire et l'enseignant sont pré-remplis depuis le cours.
                  </Form.Text>
                )}
              </Form.Group>
            </Col>

            {/* ── Auditoire (auto-filled) ── */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Auditoire *{" "}
                  {scheduleForm.course && (
                    <Badge bg="success" style={{ fontSize: "0.65rem", fontWeight: 400 }}>auto</Badge>
                  )}
                </Form.Label>
                <Form.Select
                  value={scheduleForm.auditoire}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, auditoire: e.target.value, timeslot: "" })}
                >
                  <option value="">— Sélectionner —</option>
                  {auditoires.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nom} ({a.vacation === "soir" ? "Soir" : "Jour"})
                    </option>
                  ))}
                </Form.Select>
                {selectedAuditoireVacation && (
                  <Form.Text className="text-info">
                    <FiInfo size={11} className="me-1" />
                    Vacation {selectedAuditoireVacation === "soir" ? "du soir" : "du jour"} — les périodes sont adaptées.
                  </Form.Text>
                )}
              </Form.Group>
            </Col>

            {/* ── Enseignant (auto-filled) ── */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Enseignant{" "}
                  {scheduleForm.course && scheduleForm.teacher && (
                    <Badge bg="success" style={{ fontSize: "0.65rem", fontWeight: 400 }}>auto</Badge>
                  )}
                </Form.Label>
                <Form.Select
                  value={scheduleForm.teacher}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, teacher: e.target.value })}
                >
                  <option value="">— Optionnel —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name} {t.role !== "enseignant" ? `(${t.role})` : ""}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* ── Trimestre (auto-rempli depuis le cours) ── */}
            {scheduleForm.term && (
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Trimestre / Semestre{" "}
                    <Badge bg="success" style={{ fontSize: "0.65rem", fontWeight: 400 }}>auto</Badge>
                  </Form.Label>
                  <Form.Control
                    readOnly
                    value={terms.find(t => String(t.id) === String(scheduleForm.term))?.name || "—"}
                    style={{ backgroundColor: "#f8f9fa" }}
                  />
                  <Form.Text className="text-success">
                    <FiCheck size={11} className="me-1" />
                    Déduit automatiquement du semestre du cours.
                  </Form.Text>
                </Form.Group>
              </Col>
            )}

            {/* ── Normal/Examen/Rattrapage: Day + Start/End Time ── */}
            {!isModuleForm && (
              <>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Jour *</Form.Label>
                    <Form.Select
                      value={scheduleForm.day_of_week}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })}
                    >
                      <option value="">— Choisir le jour —</option>
                      {DAY_KEYS.map((d, i) => (
                        <option key={d} value={d}>{DAYS[i]}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Heure début *</Form.Label>
                    <Form.Control
                      type="time"
                      value={scheduleForm.start_time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Heure fin *</Form.Label>
                    <Form.Control
                      type="time"
                      value={scheduleForm.end_time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    />
                    {scheduleForm.start_time && scheduleForm.end_time && scheduleForm.start_time >= scheduleForm.end_time && (
                      <Form.Text className="text-danger">
                        <FiAlertTriangle size={11} className="me-1" />
                        L'heure de fin doit être après l'heure de début.
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </>
            )}

            {/* ── Module: Date range + optional times ── */}
            {isModuleForm && (
              <>
                <Col md={12}>
                  <Alert variant="info" className="py-2" style={{ fontSize: "0.85rem" }}>
                    <FiInfo className="me-1" />
                    Un module est un cours intensif sur une période définie. Vous pouvez optionnellement préciser les heures de début et fin.
                  </Alert>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Du (date début) *</Form.Label>
                    <Form.Control
                      type="date"
                      value={scheduleForm.module_start_date}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, module_start_date: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Au (date fin) *</Form.Label>
                    <Form.Control
                      type="date"
                      value={scheduleForm.module_end_date}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, module_end_date: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Heure de début</Form.Label>
                    <Form.Control
                      type="time"
                      value={scheduleForm.module_start_time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, module_start_time: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Heure de fin</Form.Label>
                    <Form.Control
                      type="time"
                      value={scheduleForm.module_end_time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, module_end_time: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </>
            )}

            {/* ── Salle ── */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Salle</Form.Label>
                <Form.Select
                  value={scheduleForm.room}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                >
                  <option value="">— Optionnel —</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* ── Notes ── */}
            <Col md={isModuleForm ? 6 : 6}>
              <Form.Group>
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  placeholder="Observations éventuelles…"
                />
              </Form.Group>
            </Col>

            {/* ── Tronc commun (only for creation) ── */}
            {!editingSchedule && (
              <Col md={12}>
                <Form.Check
                  type="switch"
                  id="tronc-commun-switch"
                  label={
                    <span>
                      <FiCopy size={14} className="me-1" />
                      Tronc commun — Appliquer à plusieurs auditoires
                    </span>
                  }
                  checked={scheduleForm.is_tronc_commun}
                  onChange={(e) => setScheduleForm({
                    ...scheduleForm,
                    is_tronc_commun: e.target.checked,
                    extra_auditoires: [],
                  })}
                />
                {scheduleForm.is_tronc_commun && (
                  <div className="mt-2 p-2 border rounded" style={{ background: "#f8f9fa" }}>
                    <Form.Label className="mb-1" style={{ fontSize: "0.85rem" }}>
                      Auditoires supplémentaires pour ce cours
                    </Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {auditoires
                        .filter((a) => String(a.id) !== String(scheduleForm.auditoire))
                        .map((a) => (
                          <Form.Check
                            key={a.id}
                            type="checkbox"
                            id={`extra-aud-${a.id}`}
                            label={a.nom}
                            checked={scheduleForm.extra_auditoires.includes(String(a.id))}
                            onChange={(e) => {
                              const audId = String(a.id)
                              setScheduleForm((prev) => ({
                                ...prev,
                                extra_auditoires: e.target.checked
                                  ? [...prev.extra_auditoires, audId]
                                  : prev.extra_auditoires.filter((id) => id !== audId),
                              }))
                            }}
                          />
                        ))}
                    </div>
                    {scheduleForm.extra_auditoires.length > 0 && (
                      <Form.Text className="text-info">
                        Le cours sera planifié dans {1 + scheduleForm.extra_auditoires.length} auditoire(s) au total.
                      </Form.Text>
                    )}
                  </div>
                )}
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSaveSchedule} disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" className="me-2" /> : null}
            {editingSchedule ? "Enregistrer" : "Créer"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Availability Modal ─────────────────────────────────────────── */}
      <Modal show={showAvailModal} onHide={() => setShowAvailModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingAvail ? "Modifier la disponibilité" : "Déclarer une disponibilité"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Jour *</Form.Label>
            <Form.Select
              value={availForm.day_of_week}
              onChange={(e) => setAvailForm({ ...availForm, day_of_week: e.target.value })}
            >
              <option value="">— Sélectionner —</option>
              {DAY_KEYS.map((d, i) => (
                <option key={d} value={d}>{DAYS[i]}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Période *</Form.Label>
            <Form.Select
              value={availForm.timeslot}
              onChange={(e) => setAvailForm({ ...availForm, timeslot: e.target.value })}
            >
              <option value="">— Sélectionner —</option>
              {timeslots.map((ts) => (
                <option key={ts.id} value={ts.id}>
                  {ts.label} ({ts.start_time?.slice(0, 5)}–{ts.end_time?.slice(0, 5)}) [{ts.vacation_type === "soir" ? "Soir" : "Jour"}]
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Type *</Form.Label>
            <Form.Select
              value={availForm.availability_type}
              onChange={(e) => setAvailForm({ ...availForm, availability_type: e.target.value })}
            >
              {AVAILABILITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Du</Form.Label>
                <Form.Control
                  type="date"
                  value={availForm.start_date}
                  onChange={(e) => setAvailForm({ ...availForm, start_date: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Au</Form.Label>
                <Form.Control
                  type="date"
                  value={availForm.end_date}
                  onChange={(e) => setAvailForm({ ...availForm, end_date: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group>
            <Form.Label>Raison</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={availForm.reason}
              onChange={(e) => setAvailForm({ ...availForm, reason: e.target.value })}
              placeholder="Congé, cours externe…"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAvailModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSaveAvail} disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" className="me-2" /> : null}
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Delete confirmation ────────────────────────────────────────── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Supprimer ce créneau{toDelete ? ` (${toDelete.course_name || toDelete.course})` : ""} ?
          Cette action est irréversible.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" className="me-2" /> : null}
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Horaire

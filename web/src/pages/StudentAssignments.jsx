import React, { useState, useEffect } from "react";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import assignmentService from "../services/assignmentService";
import SubmitAssignment from "../components/Students/SubmitAssignment";

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, submissionsRes] = await Promise.all([
        assignmentService.getAssignments(),
        assignmentService.getMySubmissions(),
      ]);
      // Fallback: handle both paginated ({results: []}) and plain array responses
      setAssignments(assignmentsRes.data?.results ?? assignmentsRes.data ?? []);
      setSubmissions(submissionsRes.data?.results ?? submissionsRes.data ?? []);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSubmission = (assignmentId) => {
    if (!submissions || submissions.length === 0) return null;
    return submissions.find(
      (s) => s.assignment?.id === assignmentId || s.assignment === assignmentId
    );
  };

  const isLate = (dueDate) => {
    if (!dueDate) return false;
    return new Date() > new Date(dueDate);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (assignment) => {
    const submission = getSubmission(assignment.id);
    const baseStyle = {
      padding: "3px 10px",
      borderRadius: "999px",
      fontSize: "0.75rem",
      fontWeight: "600",
      display: "inline-block",
    };
    if (!submission) {
      if (isLate(assignment.due_date)) {
        return <span style={{ ...baseStyle, background: "rgba(220,53,69,0.1)", color: "#dc3545" }}>En retard</span>;
      }
      return <span style={{ ...baseStyle, background: "rgba(255,193,7,0.15)", color: "#856404" }}>A faire</span>;
    }
    if (submission.status === "graded") {
      return <span style={{ ...baseStyle, background: "rgba(40,167,69,0.1)", color: "#28a745" }}>Note</span>;
    }
    return <span style={{ ...baseStyle, background: "rgba(var(--color-primaryRGB), 0.1)", color: "var(--color-primary)" }}>Soumis</span>;
  };

  const filteredAssignments = assignments.filter((a) => {
    const submission = getSubmission(a.id);
    if (filter === "todo") return !submission;
    if (filter === "submitted") return submission && submission.status !== "graded";
    if (filter === "graded") return submission && submission.status === "graded";
    return true;
  });

  if (selectedAssignment) {
    return (
      <SubmitAssignment
        assignment={selectedAssignment}
        onComplete={() => { setSelectedAssignment(null); loadData(); }}
        onCancel={() => setSelectedAssignment(null)}
      />
    );
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "16rem" }}
      >
        <div style={{
          animation: "spin 1s linear infinite",
          borderRadius: "50%",
          height: "3rem",
          width: "3rem",
          border: "3px solid transparent",
          borderTopColor: "var(--color-primary)",
        }} />
      </motion.div>
    );
  }

  const filterBtnStyle = (active, activeColor) => ({
    padding: "8px 16px",
    borderRadius: "8px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    background: active ? (activeColor || "linear-gradient(135deg, var(--color-primary), #667eea)") : "var(--color-cardBg)",
    color: active ? "white" : "var(--color-text)",
    border: active ? "none" : "1px solid var(--color-border)",
    cursor: "pointer",
    boxShadow: active ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.05)",
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ minHeight: "100%", background: "var(--color-bodyBg)", padding: "24px" }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--color-text)", marginBottom: "6px" }}>
            Mes Devoirs (TP/TD)
          </h2>
          <p style={{ color: "var(--color-textSecondary)" }}>Gerez vos travaux pratiques et diriges</p>
        </motion.div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
        >
          <button onClick={() => setFilter("all")} style={filterBtnStyle(filter === "all")}>
            Tous ({assignments.length})
          </button>
          <button onClick={() => setFilter("todo")} style={filterBtnStyle(filter === "todo", "linear-gradient(135deg, #f5af19, #f12711)")}>
            A faire ({assignments.filter((a) => !getSubmission(a.id)).length})
          </button>
          <button onClick={() => setFilter("submitted")} style={filterBtnStyle(filter === "submitted")}>
            Soumis ({submissions.filter((s) => s.status !== "graded").length})
          </button>
          <button onClick={() => setFilter("graded")} style={filterBtnStyle(filter === "graded", "linear-gradient(135deg, #11998e, #38ef7d)")}>
            Notes ({submissions.filter((s) => s.status === "graded").length})
          </button>
        </motion.div>

        {/* Liste */}
        <AnimatePresence mode="wait">
          {filteredAssignments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{
                textAlign: "center", padding: "48px",
                background: "var(--color-cardBg)", borderRadius: "16px",
                border: "1px solid var(--color-border)",
                boxShadow: "0 4px 6px rgba(0,0,0,0.07)"
              }}
            >
              <FileText style={{ width: "4rem", height: "4rem", margin: "0 auto 16px", color: "var(--color-textSecondary)", opacity: 0.4 }} />
              <p style={{ color: "var(--color-textSecondary)", fontSize: "1rem" }}>Aucun devoir trouve</p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "grid", gap: "16px" }}>
              {filteredAssignments.map((assignment, index) => {
                const submission = getSubmission(assignment.id);
                const late = isLate(assignment.due_date);

                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01, y: -3 }}
                    style={{
                      background: "var(--color-cardBg)",
                      borderRadius: "16px",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                      padding: "24px",
                      border: `1px solid ${late && !submission ? "rgba(220,53,69,0.3)" : "var(--color-border)"}`,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {/* Row 1: type + status + title */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600",
                            background: assignment.assignment_type === "TP" ? "rgba(14,140,155,0.1)" : "rgba(111,66,193,0.1)",
                            color: assignment.assignment_type === "TP" ? "#0E8C9B" : "#6f42c1",
                          }}>
                            {assignment.assignment_type}
                          </span>
                          {getStatusBadge(assignment)}
                          {late && !submission && <AlertCircle style={{ width: "18px", height: "18px", color: "#dc3545" }} />}
                        </div>
                        <h3 style={{ fontWeight: "700", fontSize: "1.1rem", color: "var(--color-text)", marginBottom: "4px" }}>
                          {assignment.title}
                        </h3>
                        <p style={{ color: "var(--color-textSecondary)", fontSize: "0.9rem" }}>
                          {assignment.course?.name || assignment.course?.nom}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", minWidth: "150px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginBottom: "4px" }}>
                          <Clock style={{ width: "14px", height: "14px", color: late && !submission ? "#dc3545" : "var(--color-textSecondary)" }} />
                          <span style={{ fontSize: "0.85rem", color: late && !submission ? "#dc3545" : "var(--color-textSecondary)", fontWeight: late && !submission ? "600" : "normal" }}>
                            {formatDate(assignment.due_date)}
                          </span>
                        </div>
                        {submission?.score !== null && submission?.score !== undefined && (
                          <div style={{ fontWeight: "700", fontSize: "1.1rem", color: "#28a745" }}>
                            {submission.score} / {assignment.max_points}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {assignment.description && (
                      <p style={{ color: "var(--color-textSecondary)", marginBottom: "16px", fontSize: "0.9rem", lineHeight: "1.5",
                                  overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {assignment.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "16px", borderTop: "1px solid var(--color-border)" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-textSecondary)" }}>
                        {assignment.questions?.length || 0} question(s)
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedAssignment(assignment)}
                        style={{
                          padding: "8px 20px", borderRadius: "8px", fontWeight: "600",
                          background: submission?.status === "graded"
                            ? "var(--color-bodyBg)"
                            : "linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)",
                          color: submission?.status === "graded" ? "var(--color-text)" : "white",
                          border: submission?.status === "graded" ? "1px solid var(--color-border)" : "none",
                          cursor: "pointer",
                          boxShadow: submission?.status === "graded" ? "none" : "0 4px 12px rgba(0,0,0,0.15)",
                        }}
                      >
                        {submission?.status === "graded" ? "Voir la correction" : submission ? "Modifier" : "Commencer"}
                      </motion.button>
                    </div>

                    {/* Feedback banner */}
                    {submission?.feedback && (
                      <div style={{
                        marginTop: "16px", padding: "12px 16px",
                        background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.3)",
                        borderRadius: "8px",
                      }}>
                        <p style={{ fontWeight: "600", color: "var(--color-text)", marginBottom: "4px", fontSize: "0.85rem" }}>
                          Feedback du professeur :
                        </p>
                        <p style={{ color: "var(--color-textSecondary)", fontSize: "0.85rem", margin: 0 }}>
                          {submission.feedback}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default StudentAssignments;

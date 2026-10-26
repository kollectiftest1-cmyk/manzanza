import { filePart, json, list, query, request } from './client'

export const api = {
  courses: {
    list: () => query('/courses/').then(list), detail: id => request(`/courses/${id}/`), materials: course => query('/courses/materials/', { course }).then(list), enrollments: course => query('/courses/enrollments/', { course }).then(list),
    createMaterial: async values => { const form = new FormData(); ['course','title','description','material_type','url'].forEach(k => values[k] && form.append(k, String(values[k]))); if (values.file) form.append('file', filePart(values.file)); return request('/courses/materials/', { method: 'POST', body: form }) },
    deleteMaterial: id => request(`/courses/materials/${id}/`, { method: 'DELETE' })
  },
  assignments: {
    list: () => query('/assignments/').then(list), detail: id => request(`/assignments/${id}/`), create: v => request('/assignments/', json('POST', v)), update: (id,v) => request(`/assignments/${id}/`, json('PATCH',v)), remove: id => request(`/assignments/${id}/`, {method:'DELETE'}), publish: id => request(`/assignments/${id}/publish/`, {method:'POST'}), close: id => request(`/assignments/${id}/close/`, {method:'POST'}),
    questions: id => request(`/assignments/${id}/questions/`), addQuestion: (id,v) => request(`/assignments/${id}/add_question/`, json('POST',v)), submissions: id => request(`/assignments/${id}/submissions/`).then(list), mine: id => request(`/assignments/${id}/my_submission/`).catch(() => null),
    submit: async (id, answers) => { const form = new FormData(); form.append('assignment', String(id)); answers.forEach((a,i) => { form.append(`answers[${i}][question_id]`, String(a.question_id)); if (a.answer_text) form.append(`answers[${i}][answer_text]`, a.answer_text); (a.selected_choices || []).forEach(c => form.append(`answers[${i}][selected_choices]`, String(c))); if (a.answer_file) form.append(`answers[${i}][answer_file]`, filePart(a.answer_file)) }); return request('/assignments/submissions/', {method:'POST',body:form}) },
    grade: (id,v) => request(`/assignments/submissions/${id}/grade/`, json('POST',v)), autoGrade: id => request(`/assignments/submissions/${id}/auto_grade/`, {method:'POST'})
  },
  quizzes: {
    list: () => query('/quiz/').then(list), detail: id => request(`/quiz/${id}/`), create: v => request('/quiz/',json('POST',v)), update:(id,v)=>request(`/quiz/${id}/`,json('PATCH',v)), remove:id=>request(`/quiz/${id}/`,{method:'DELETE'}), publish:id=>request(`/quiz/${id}/publish/`,{method:'POST'}), close:id=>request(`/quiz/${id}/close/`,{method:'POST'}),
    questions:id=>request(`/quiz/${id}/questions/`), addQuestion:(id,v)=>request(`/quiz/${id}/add_question/`,json('POST',v)), attempts:id=>request(`/quiz/${id}/attempts/`).then(list), mine:id=>request(`/quiz/${id}/my_attempts/`).then(list), start:id=>request(`/quiz/${id}/start_attempt/`,{method:'POST'}),
    save:(attemptId,answers)=>request(`/quiz/attempts/${attemptId}/save_answers/`,json('POST',{answers})), submit:(attemptId,answers)=>request(`/quiz/attempts/${attemptId}/submit/`,json('POST',{answers})), grade:(attemptId,v)=>request(`/quiz/attempts/${attemptId}/grade/`,json('POST',v)), autoGrade:id=>request(`/quiz/attempts/${id}/auto_grade/`,{method:'POST'})
  },
  grades: {
    mine:()=>request('/grades/grades/my-grades/'), transcript:()=>request('/grades/transcripts/my-transcript/'), course:id=>query('/grades/grades/',{course:id}).then(list), categories:()=>query('/grades/categories/').then(list), assessments:id=>query('/grades/grades/course-assessments/',{course:id}), create:v=>request('/grades/grades/',json('POST',v)), update:(id,v)=>request(`/grades/grades/${id}/`,json('PUT',v)), remove:id=>request(`/grades/grades/${id}/`,{method:'DELETE'}), bulk:v=>request('/grades/grades/bulk-assessment/',json('POST',v))
  },
  attendance: {
    sessions:()=>query('/courses/attendance-sessions/my_sessions/').then(list), create:v=>request('/courses/attendance-sessions/',json('POST',v)), finalize:id=>request(`/courses/attendance-sessions/${id}/finalize/`,{method:'POST'}), students:course=>query('/courses/attendances/course-report/',{course_id:course}), bulk:v=>request('/courses/attendances/bulk_create/',json('POST',v)), mine:()=>request('/courses/attendances/my_attendances/'), statistics:()=>request('/courses/attendances/statistics/')
  },
  schedule: {
    mine:()=>request('/schedules/schedules/my-schedule/'), years:()=>query('/schedules/academic-years/').then(list), terms:()=>query('/schedules/terms/').then(list), events:()=>query('/schedules/academic-events/').then(list), timeslots:()=>query('/schedules/timeslots/').then(list), availability:()=>request('/schedules/availability/my-availability/').then(list), addAvailability:v=>request('/schedules/availability/',json('POST',v)), removeAvailability:id=>request(`/schedules/availability/${id}/`,{method:'DELETE'})
  },
  auditoires: { list:()=>query('/auditoires/').then(list), detail:id=>request(`/auditoires/${id}/`), students:id=>request(`/auditoires/${id}/students/`).then(list), courses:id=>request(`/auditoires/${id}/courses/`).then(list) },
  chat: {
    channels:()=>request('/chat/channels/my_channels/').then(list), messages:id=>request(`/chat/channels/${id}/messages/`).then(list), send:v=>request('/chat/messages/',json('POST',v)), create:v=>request('/chat/channels/',json('POST',v)), react:(id,reaction_type)=>request(`/chat/messages/${id}/react/`,json('POST',{reaction_type})), remove:id=>request(`/chat/messages/${id}/delete_message/`,{method:'POST'})
  },
  notifications: {
    list:()=>query('/notifications/').then(list), announcements:()=>query('/notifications/announcements/').then(list), read:id=>request(`/notifications/${id}/mark_read/`,{method:'POST'}), readAll:()=>request('/notifications/mark_all_read/',{method:'POST'}), clear:()=>request('/notifications/clear_all/',{method:'DELETE'})
  },
  library: {
    books:p=>query('/library/books/',p).then(list), loans:()=>request('/library/loans/my_loans/').then(list), borrow:id=>request(`/library/books/${id}/borrow/`,{method:'POST'}), reserve:id=>request(`/library/books/${id}/reserve/`,{method:'POST'}), returnBook:id=>request(`/library/loans/${id}/return_book/`,{method:'POST'})
  },
  tickets: {
    list:()=>query('/core/tickets/').then(list), create:v=>request('/core/tickets/',json('POST',v)), close:id=>request(`/core/tickets/${id}/close/`,{method:'POST'})
  },
  scolarite: {
    results:()=>request('/scolarite/resultats/me/').then(list), clearance:()=>request('/scolarite/clearance/me/'),
    inscriptions:()=>request('/scolarite/inscriptions/me/').then(list), documents:()=>query('/scolarite/documents/').then(list)
  },
  payments: {
    fees:()=>request('/payments/student-fees/my_fees/').then(list), payments:()=>query('/payments/').then(list), mobile:v=>request('/payments/mobile-money/',json('POST',v)), voucher:v=>request('/payments/vouchers/create-voucher/',json('POST',v)), vouchers:()=>query('/payments/vouchers/').then(list), receipts:()=>query('/payments/receipts/').then(list)
  },
  profile: {
    me:()=>request('/users/me/'), update:v=>request('/users/update_profile/',json('PATCH',v)), password:v=>request('/users/change_password/',json('POST',v)), avatar:async(id,asset)=>{const form=new FormData();form.append('avatar',filePart(asset));return request(`/users/${id}/avatar/`,{method:'POST',body:form})}
  }
}

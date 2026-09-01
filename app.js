/* ==========================================================================
   app.js — طبقة بيانات وهمية (Mock) تحاكي Firebase Auth + Firestore
   ==========================================================================
   الهدف: تشغيل المنصة كاملة فورًا من غير سيرفر عشان تقدروا تجربوها دلوقتي.
   كل دالة هنا لازم تتستبدل لاحقًا بنداء حقيقي لـ Firebase (تعليق فوق كل واحدة
   بيوضح الاستبدال المطلوب بالظبط).
   ========================================================================== */

const DB_KEY = 'edu_platform_db_v1';
const SESSION_KEY = 'edu_platform_session_v1';

function seedDB(){
  return {
    users: [
      { id:'t1', role:'teacher', name:'أ. محمود سيد', phone:'01000000001', password:'123456', subject:'الفيزياء', earnings: 18400, studentsCount: 5 },
      { id:'s1', role:'student', name:'يوسف أحمد', phone:'01000000002', password:'123456', grade:'الصف الثالث الثانوي', parentId:'p1', deviceId:null },
      { id:'p1', role:'parent', name:'أحمد محمد (ولي أمر يوسف)', phone:'01000000003', password:'123456', childId:'s1' },
      { id:'a1', role:'admin', name:'مدير المنصة', phone:'01000000004', password:'123456' },
    ],
    lessons: [
      { id:'l1', order:1, title:'الحصة 1: قوانين نيوتن للحركة', duration:'45:00', quizId:'q1' },
      { id:'l2', order:2, title:'الحصة 2: الشغل والطاقة', duration:'38:20', quizId:'q2' },
      { id:'l3', order:3, title:'الحصة 3: قانون حفظ الطاقة', duration:'41:10', quizId:'q3' },
      { id:'l4', order:4, title:'الحصة 4: الحركة الدورية', duration:'36:45', quizId:'q4' },
    ],
    // تقدّم الطالب: أول حصة مفتوحة والباقي مقفول لحد ما يجتاز الكويز (Drip Content)
    progress: { s1: { completedLessons:['l1'], quizScores:{ q1: 80 } } },
    quizzes: {
      q1: { passScore:60, questions:[
        { q:'وحدة قياس القوة في النظام الدولي هي؟', options:['نيوتن','جول','واط','باسكال'], correct:0 },
        { q:'قانون نيوتن الأول يتكلم عن؟', options:['العطالة','التسارع','الفعل ورد الفعل','الطاقة'], correct:0 },
      ]},
      q2: { passScore:60, questions:[
        { q:'الشغل يساوي؟', options:['القوة × الإزاحة','الكتلة × التسارع','القوة ÷ الزمن','الكتلة × السرعة'], correct:0 },
        { q:'وحدة قياس الطاقة هي؟', options:['الجول','النيوتن','الأمبير','الفولت'], correct:0 },
      ]},
    },
    payments: [
      { id:'pay1', student:'يوسف أحمد', item:'اشتراك شهر أكتوبر', amount:150, method:'فودافون كاش', status:'مكتمل', date:'2026-08-28' },
      { id:'pay2', student:'مريم علي', item:'اشتراك ترم كامل', amount:600, method:'فوري', status:'مكتمل', date:'2026-08-30' },
    ],
  };
}

function db(){
  let raw = localStorage.getItem(DB_KEY);
  if(!raw){ const seeded = seedDB(); localStorage.setItem(DB_KEY, JSON.stringify(seeded)); return seeded; }
  return JSON.parse(raw);
}
function saveDB(data){ localStorage.setItem(DB_KEY, JSON.stringify(data)); }

/* ---------------- الجهاز الحالي (Single Device Login) ----------------
   TODO (Firebase حقيقي): خزّن deviceId في مستند users/{uid} في Firestore،
   واستخدم Cloud Function أو Firestore Rule يقارن كل طلب بالـ deviceId
   المسجّل، ولو مختلف اعمل signOut فورًا من الجهاز القديم عبر
   Firebase Auth Admin SDK (revokeRefreshTokens). */
function getDeviceId(){
  let id = localStorage.getItem('edu_device_id');
  if(!id){
    id = 'DEV-' + Math.random().toString(36).slice(2,8).toUpperCase();
    localStorage.setItem('edu_device_id', id);
  }
  return id;
}

/* ---------------- الجلسة الحالية ---------------- */
function currentSession(){
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}
function setSession(user){ sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
function clearSession(){ sessionStorage.removeItem(SESSION_KEY); }

/* ---------------- تسجيل الدخول ----------------
   TODO (Firebase حقيقي): استبدل هذا بـ
   signInWithEmailAndPassword(auth, phoneAsEmail, password)
   ثم اقرأ دور المستخدم من مستند users/{uid} في Firestore. */
function login(phone, password, expectedRole){
  const data = db();
  const user = data.users.find(u => u.phone === phone && u.password === password && u.role === expectedRole);
  if(!user) return { ok:false, msg:'رقم الهاتف أو كلمة المرور غير صحيحة.' };

  const thisDevice = getDeviceId();
  if(user.deviceId && user.deviceId !== thisDevice){
    // محاكاة: تسجيل خروج تلقائي للجهاز القديم + تحديث الجهاز النشط للجديد
    user.deviceId = thisDevice;
    saveDB(data);
    setSession(user);
    return { ok:true, user, kicked:true };
  }
  user.deviceId = thisDevice;
  saveDB(data);
  setSession(user);
  return { ok:true, user, kicked:false };
}

function registerStudent(fields){
  const data = db();
  if(data.users.some(u => u.phone === fields.phone)){
    return { ok:false, msg:'رقم الهاتف ده مسجّل قبل كده.' };
  }
  const id = 's' + (data.users.length + 1);
  const user = { id, role:'student', name:fields.name, phone:fields.phone, password:fields.password, grade:fields.grade, parentPhone:fields.parentPhone, deviceId:null };
  data.users.push(user);
  data.progress[id] = { completedLessons:[], quizScores:{} };
  saveDB(data);
  return { ok:true, user };
}

function logout(){ clearSession(); location.href = 'index.html'; }

function requireAuth(role){
  const s = currentSession();
  if(!s || s.role !== role){ location.href = 'auth.html'; return null; }
  return s;
}

/* ---------------- تقدّم الطالب / نظام Drip Content ---------------- */
function getLessonsWithStatus(studentId){
  const data = db();
  const prog = data.progress[studentId] || { completedLessons:[], quizScores:{} };
  return data.lessons.sort((a,b)=>a.order-b.order).map((l, i) => {
    const done = prog.completedLessons.includes(l.id);
    const prevLesson = data.lessons.find(x => x.order === l.order - 1);
    const locked = i > 0 && prevLesson && !prog.completedLessons.includes(prevLesson.id);
    return { ...l, done, locked };
  });
}

function submitQuiz(studentId, quizId, answers){
  const data = db();
  const quiz = data.quizzes[quizId];
  if(!quiz) return { ok:false };
  let correct = 0;
  quiz.questions.forEach((q,i) => { if(answers[i] === q.correct) correct++; });
  const score = Math.round((correct / quiz.questions.length) * 100);
  const passed = score >= quiz.passScore;
  const prog = data.progress[studentId] || { completedLessons:[], quizScores:{} };
  prog.quizScores[quizId] = score;
  if(passed){
    const lesson = data.lessons.find(l => l.quizId === quizId);
    if(lesson && !prog.completedLessons.includes(lesson.id)) prog.completedLessons.push(lesson.id);
  }
  data.progress[studentId] = prog;
  saveDB(data);
  return { ok:true, score, passed, correct, total: quiz.questions.length };
}

/* ---------------- الموبايل: فتح/قفل القائمة الجانبية ---------------- */
function toggleSide(){
  document.querySelector('.side')?.classList.toggle('open');
}
function toggleNav(){
  document.querySelector('.nav')?.classList.toggle('open');
}

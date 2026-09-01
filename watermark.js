/* ==========================================================================
   watermark.js — العلامة المائية الديناميكية المتحركة
   ==========================================================================
   ليه العلامة المائية مش "منع تسجيل الشاشة"؟
   منع تسجيل الشاشة فعليًا مستحيل على متصفح ويب عادي (مافيش API متاح للمواقع
   يقدر يمنع أدوات تسجيل الشاشة في نظام التشغيل). اللي بيشتغل فعلاً هو ردع:
   لو الطالب صوّر الشاشة أو صوّرها بموبايل تاني، اسمه ورقمه ومعرّف جهازه
   هيبانوا في كل لقطة — فأي نسخة مسروقة تنكشف لصاحبها فورًا.

   TODO (إنتاج حقيقي): اربط قيمة الـ IP الحقيقية عن طريق نداء لسيرفر
   (مثلاً https://api.ipify.org) وابعتها هنا بدل القيمة التقريبية. */

function startWatermark(containerEl, user){
  const wm = document.createElement('div');
  wm.className = 'watermark';
  containerEl.appendChild(wm);

  const label = `${user.name}  |  ${user.phone}  |  جهاز: ${getDeviceId()}`;
  wm.textContent = label;

  function place(){
    const maxTop = containerEl.clientHeight - 30;
    const maxLeft = containerEl.clientWidth - wm.clientWidth - 20;
    wm.style.top = Math.max(10, Math.random() * maxTop) + 'px';
    wm.style.right = Math.max(10, Math.random() * Math.max(maxLeft,10)) + 'px';
  }
  place();
  return setInterval(place, 4000);
}

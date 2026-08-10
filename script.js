// ======================================================
// script.js
// الصفحة الرئيسية + Firebase Authentication
// ======================================================

import {

  db,
  collection,
  query,
  where,
  onSnapshot,

  auth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail

} from "./firebase-config.js";


// ======================================================
// العناصر
// ======================================================

const homeContent =
  document.getElementById(
    "homeContent"
  );

const adminBtn =
  document.getElementById(
    "adminBtn"
  );

const adminStatusDot =
  document.getElementById(
    "adminStatusDot"
  );

const adminModal =
  document.getElementById(
    "adminModal"
  );

const closeModal =
  document.getElementById(
    "closeModal"
  );

const cancelBtn =
  document.getElementById(
    "cancelBtn"
  );

const loginBtn =
  document.getElementById(
    "loginBtn"
  );

const adminEmail =
  document.getElementById(
    "adminEmail"
  );

const adminPassword =
  document.getElementById(
    "adminPassword"
  );

const forgotPasswordBtn =
  document.getElementById(
    "forgotPasswordBtn"
  );

const soundBtn =
  document.getElementById(
    "soundBtn"
  );

const toast =
  document.getElementById(
    "toast"
  );


// ======================================================
// المتغيرات
// ======================================================

let soundEnabled =
  true;

let currentUser =
  null;


// ======================================================
// مراقبة تسجيل الدخول
// ======================================================

onAuthStateChanged(
  auth,
  user => {

    currentUser =
      user ||
      null;


    if (
      currentUser
    ) {

      adminBtn.title =
        "فتح لوحة الإدارة";


      adminBtn.setAttribute(
        "aria-label",
        "فتح لوحة الإدارة"
      );


      adminStatusDot
        .classList
        .add(
          "online"
        );

    }

    else {

      adminBtn.title =
        "تسجيل دخول الإدارة";


      adminBtn.setAttribute(
        "aria-label",
        "تسجيل دخول الإدارة"
      );


      adminStatusDot
        .classList
        .remove(
          "online"
        );

    }

  }
);


// ======================================================
// الاستبانات النشطة
// ======================================================

const activeSurveysQuery =
  query(

    collection(
      db,
      "surveys"
    ),

    where(
      "status",
      "==",
      "active"
    )

  );


// ======================================================
// Live Realtime
// ======================================================

const unsubscribeSurveys =
  onSnapshot(

    activeSurveysQuery,

    snapshot => {

      const surveys =
        [];


      snapshot.forEach(
        documentSnapshot => {

          surveys.push({

            id:
              documentSnapshot.id,

            ...documentSnapshot.data()

          });

        }
      );


      surveys.sort(
        (
          a,
          b
        ) => {

          return (
            getTimestampValue(
              b.createdAt
            ) -
            getTimestampValue(
              a.createdAt
            )
          );

        }
      );


      if (
        surveys.length === 0
      ) {

        renderNoSurveys();

      }

      else {

        renderActiveSurveys(
          surveys
        );

      }

    },

    error => {

      console.error(
        "Home realtime error:",
        error
      );


      renderErrorState();

    }

  );


// ======================================================
// لا توجد استبانات
// ======================================================

function renderNoSurveys() {

  homeContent.innerHTML = `

    <div class="no-surveys-card">


      <div class="no-surveys-content">


        <div class="welcome-icon">
          ✨
        </div>


        <h2>
          حيّاكم الله
        </h2>


        <div class="no-surveys-main-text">

          لا توجد استبانات متاحة
          للمشاركة حاليًا.

        </div>


        <div class="coming-soon-box">

          🌷 نلتقي بكم قريبًا
          في استبانة جديدة

        </div>


        <div class="thanks">

          💜 شكرًا لزيارتكم

        </div>


      </div>



      <div class="no-surveys-person">


        <div
          class="person-halo"
          aria-hidden="true"
        ></div>


        <img

          src="assets/fadhel.png"

          alt="أستاذ فاضل"

          class="person-image"

          onerror="
            this.style.display='none';
          "

        >


      </div>


    </div>

  `;

}


// ======================================================
// عرض الاستبانات
// ======================================================

function renderActiveSurveys(
  surveys
) {

  homeContent.innerHTML = `

    <section class="surveys-section">


      <div class="section-header">

        <h2>
          الاستبانات المتاحة
        </h2>

        <p>
          اختر الاستبانة التي ترغب بالمشاركة فيها
        </p>

      </div>


      <div
        id="activeSurveysGrid"
        class="surveys-grid"
      ></div>


    </section>

  `;


  const grid =
    document.getElementById(
      "activeSurveysGrid"
    );


  surveys.forEach(
    survey => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "survey-card";


      card.innerHTML = `

        <div class="survey-card-icon">
          📋
        </div>


        <h3>

          ${escapeHtml(
            survey.title ||
            "استبانة"
          )}

        </h3>


        <p>

          ${
            survey.description
              ?
              escapeHtml(
                survey.description
              )
              :
              "شاركنا رأيك من خلال هذه الاستبانة."
          }

        </p>


        <div class="survey-card-meta">


          <span class="meta-badge">

            ❓
            ${Number(
              survey.questionsCount ||
              0
            )}
            سؤال

          </span>


          <span class="meta-badge">

            👥
            ${Number(
              survey.responses ||
              0
            )}
            مشاركة

          </span>


          <span class="meta-badge">
            🟢 متاحة الآن
          </span>


        </div>


        <button

          type="button"

          class="open-survey-btn"

          data-slug="${escapeAttribute(
            survey.slug ||
            ""
          )}"

        >

          المشاركة في الاستبانة ←

        </button>

      `;


      grid.appendChild(
        card
      );

    }
  );


  grid
    .querySelectorAll(
      ".open-survey-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const slug =
              button.dataset.slug;


            if (!slug) {

              showToast(
                "تعذر فتح الاستبانة"
              );

              return;

            }


            window.location.href =
              `survey.html?s=${encodeURIComponent(
                slug
              )}`;

          }
        );

      }
    );

}


// ======================================================
// خطأ
// ======================================================

function renderErrorState() {

  homeContent.innerHTML = `

    <div class="loading-card">

      <div class="loading-icon">
        ⚠️
      </div>

      <h2>
        تعذر تحميل الاستبانات
      </h2>

      <p>
        تحقق من الاتصال بالإنترنت
        ثم حاول تحديث الصفحة.
      </p>

    </div>

  `;

}


// ======================================================
// زر الإدارة
// ======================================================

adminBtn.addEventListener(
  "click",
  () => {

    if (
      currentUser
    ) {

      window.location.href =
        "admin.html";

      return;

    }


    adminModal
      .classList
      .add(
        "show"
      );


    setTimeout(
      () => {

        adminEmail.focus();

      },
      120
    );

  }
);


// ======================================================
// إغلاق النافذة
// ======================================================

function closeAdminModal() {

  adminModal
    .classList
    .remove(
      "show"
    );


  adminPassword.value =
    "";


  loginBtn.disabled =
    false;


  loginBtn.textContent =
    "🔑 تسجيل الدخول";

}


closeModal.addEventListener(
  "click",
  closeAdminModal
);


cancelBtn.addEventListener(
  "click",
  closeAdminModal
);


adminModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      adminModal
    ) {

      closeAdminModal();

    }

  }
);


// ======================================================
// تسجيل الدخول
// ======================================================

loginBtn.addEventListener(
  "click",
  loginAdmin
);


adminPassword.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Enter"
    ) {

      event.preventDefault();

      loginAdmin();

    }

  }
);


adminEmail.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Enter"
    ) {

      event.preventDefault();

      adminPassword.focus();

    }

  }
);


async function loginAdmin() {

  const email =
    adminEmail
      .value
      .trim();


  const password =
    adminPassword
      .value;


  if (!email) {

    showToast(
      "أدخل البريد الإلكتروني"
    );

    adminEmail.focus();

    return;

  }


  if (!password) {

    showToast(
      "أدخل كلمة المرور"
    );

    adminPassword.focus();

    return;

  }


  try {

    loginBtn.disabled =
      true;


    loginBtn.textContent =
      "جاري تسجيل الدخول...";


    await signInWithEmailAndPassword(

      auth,

      email,

      password

    );


    showToast(
      "تم تسجيل الدخول بنجاح ✅"
    );


    setTimeout(
      () => {

        window.location.href =
          "admin.html";

      },
      350
    );

  }

  catch (error) {

    console.error(
      "Login error:",
      error
    );


    handleLoginError(
      error
    );


    loginBtn.disabled =
      false;


    loginBtn.textContent =
      "🔑 تسجيل الدخول";

  }

}


// ======================================================
// أخطاء الدخول
// ======================================================

function handleLoginError(
  error
) {

  const code =
    error?.code ||
    "";


  if (
    code ===
      "auth/invalid-email"
  ) {

    showToast(
      "صيغة البريد الإلكتروني غير صحيحة"
    );

    return;

  }


  if (
    code ===
      "auth/invalid-credential" ||
    code ===
      "auth/wrong-password" ||
    code ===
      "auth/user-not-found"
  ) {

    showToast(
      "البريد الإلكتروني أو كلمة المرور غير صحيحة"
    );

    return;

  }


  if (
    code ===
      "auth/too-many-requests"
  ) {

    showToast(
      "محاولات كثيرة، حاول لاحقًا"
    );

    return;

  }


  if (
    code ===
      "auth/network-request-failed"
  ) {

    showToast(
      "تعذر الاتصال بالإنترنت"
    );

    return;

  }


  showToast(
    "تعذر تسجيل الدخول"
  );

}


// ======================================================
// استعادة كلمة المرور
// ======================================================

forgotPasswordBtn
  .addEventListener(
    "click",
    resetPassword
  );


async function resetPassword() {

  const email =
    adminEmail
      .value
      .trim();


  if (!email) {

    showToast(
      "اكتب بريدك الإلكتروني أولًا"
    );

    adminEmail.focus();

    return;

  }


  try {

    forgotPasswordBtn.disabled =
      true;


    await sendPasswordResetEmail(

      auth,

      email

    );


    showToast(
      "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك ✅"
    );

  }

  catch (error) {

    console.error(
      "Reset password error:",
      error
    );


    showToast(
      "تعذر إرسال رسالة إعادة التعيين"
    );

  }

  finally {

    forgotPasswordBtn.disabled =
      false;

  }

}


// ======================================================
// الصوت
// ======================================================

soundBtn.addEventListener(
  "click",
  () => {

    soundEnabled =
      !soundEnabled;


    soundBtn.textContent =
      soundEnabled
        ?
        "🔊"
        :
        "🔇";


    showToast(

      soundEnabled

        ?

        "تم تشغيل المؤثرات الصوتية"

        :

        "تم إيقاف المؤثرات الصوتية"

    );

  }
);


// ======================================================
// Escape
// ======================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      closeAdminModal();

    }

  }
);


// ======================================================
// Toast
// ======================================================

function showToast(
  message
) {

  if (!toast) {
    return;
  }


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

    },
    2500
  );

}


// ======================================================
// Timestamp
// ======================================================

function getTimestampValue(
  timestamp
) {

  if (!timestamp) {

    return 0;

  }


  if (
    typeof timestamp.toMillis ===
    "function"
  ) {

    return timestamp.toMillis();

  }


  if (
    typeof timestamp.seconds ===
    "number"
  ) {

    return (
      timestamp.seconds *
      1000
    );

  }


  return 0;

}


// ======================================================
// حماية HTML
// ======================================================

function escapeHtml(
  text
) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    text ||
    "";


  return div.innerHTML;

}


// ======================================================
// حماية Attribute
// ======================================================

function escapeAttribute(
  text
) {

  return String(
    text ||
    ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    );

}


// ======================================================
// تنظيف المستمع
// ======================================================

window.addEventListener(
  "beforeunload",
  () => {

    if (
      typeof unsubscribeSurveys ===
      "function"
    ) {

      unsubscribeSurveys();

    }

  }
);
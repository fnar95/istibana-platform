// ======================================================
// admin.js
// لوحة الإدارة + Firebase Authentication
// ======================================================

import {

  db,

  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,

  auth,
  onAuthStateChanged,
  signOut

} from "./firebase-config.js";


// ======================================================
// عناصر الحماية
// ======================================================

const authGuard =
  document.getElementById(
    "authGuard"
  );

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );

const adminUserEmail =
  document.getElementById(
    "adminUserEmail"
  );


// ======================================================
// عناصر إنشاء الاستبانة
// ======================================================

const surveyTitle =
  document.getElementById(
    "surveyTitle"
  );

const surveyDescription =
  document.getElementById(
    "surveyDescription"
  );

const surveySlug =
  document.getElementById(
    "surveySlug"
  );

const createSurveyBtn =
  document.getElementById(
    "createSurveyBtn"
  );


// ======================================================
// القائمة والإحصاءات
// ======================================================

const surveyList =
  document.getElementById(
    "surveyList"
  );

const surveyCount =
  document.getElementById(
    "surveyCount"
  );

const responseCount =
  document.getElementById(
    "responseCount"
  );

const activeCount =
  document.getElementById(
    "activeCount"
  );

const toast =
  document.getElementById(
    "toast"
  );


// ======================================================
// نافذة التعديل
// ======================================================

const editSurveyModal =
  document.getElementById(
    "editSurveyModal"
  );

const closeEditModal =
  document.getElementById(
    "closeEditModal"
  );

const cancelSurveyEditBtn =
  document.getElementById(
    "cancelSurveyEditBtn"
  );

const saveSurveyEditBtn =
  document.getElementById(
    "saveSurveyEditBtn"
  );

const editSurveyTitle =
  document.getElementById(
    "editSurveyTitle"
  );

const editSurveyDescription =
  document.getElementById(
    "editSurveyDescription"
  );

const editSurveySlug =
  document.getElementById(
    "editSurveySlug"
  );


// ======================================================
// QR
// ======================================================

const qrModal =
  document.getElementById(
    "qrModal"
  );

const qrCode =
  document.getElementById(
    "qrCode"
  );

const qrSurveyTitle =
  document.getElementById(
    "qrSurveyTitle"
  );

const qrSurveyUrl =
  document.getElementById(
    "qrSurveyUrl"
  );

const closeQrModal =
  document.getElementById(
    "closeQrModal"
  );

const closeQrModalBtn =
  document.getElementById(
    "closeQrModalBtn"
  );

const copyQrLinkBtn =
  document.getElementById(
    "copyQrLinkBtn"
  );


// ======================================================
// البيانات
// ======================================================

let surveys =
  [];

let editingSurveyId =
  null;

let currentQrUrl =
  "";

let authChecked =
  false;


// ======================================================
// حماية لوحة الإدارة
// ======================================================

const unsubscribeAuth =
  onAuthStateChanged(

    auth,

    user => {

      authChecked =
        true;


      // --------------------------------------
      // غير مسجل
      // --------------------------------------

      if (!user) {

        window.location.replace(
          "index.html"
        );

        return;

      }


      // --------------------------------------
      // مسجل
      // --------------------------------------

      adminUserEmail.textContent =
        user.email ||
        "حساب الإدارة";


      authGuard.classList.add(
        "hidden"
      );


      // لا نحمّل البيانات إلا بعد التأكد من الدخول

      loadSurveys();

    },

    error => {

      console.error(
        "Auth guard error:",
        error
      );


      window.location.replace(
        "index.html"
      );

    }

  );


// ======================================================
// تسجيل الخروج
// ======================================================

logoutBtn.addEventListener(
  "click",
  async () => {

    const confirmed =
      confirm(
        "هل تريد تسجيل الخروج من لوحة الإدارة؟"
      );


    if (!confirmed) {
      return;
    }


    try {

      logoutBtn.disabled =
        true;


      logoutBtn.textContent =
        "جاري الخروج...";


      await signOut(
        auth
      );


      // onAuthStateChanged سينفذ التحويل

    }

    catch (error) {

      console.error(
        "Logout error:",
        error
      );


      showToast(
        "تعذر تسجيل الخروج"
      );


      logoutBtn.disabled =
        false;


      logoutBtn.textContent =
        "🚪 تسجيل الخروج";

    }

  }
);


// ======================================================
// إنشاء استبانة
// ======================================================

createSurveyBtn.addEventListener(
  "click",
  async () => {

    if (
      !auth.currentUser
    ) {

      showToast(
        "انتهت جلسة تسجيل الدخول"
      );

      return;

    }


    const title =
      surveyTitle
        .value
        .trim();


    const description =
      surveyDescription
        .value
        .trim();


    let slug =
      cleanSlug(
        surveySlug.value
      );


    if (!title) {

      showToast(
        "اكتب عنوان الاستبانة"
      );

      surveyTitle.focus();

      return;

    }


    if (!slug) {

      slug =
        "survey-" +
        Date.now();

    }


    const slugExists =
      surveys.some(
        survey =>
          survey.slug ===
          slug
      );


    if (slugExists) {

      showToast(
        "اسم رابط الاستبانة مستخدم مسبقًا"
      );

      surveySlug.focus();

      return;

    }


    try {

      createSurveyBtn.disabled =
        true;


      createSurveyBtn.textContent =
        "جاري إنشاء الاستبانة...";


      await addDoc(

        collection(
          db,
          "surveys"
        ),

        {

          title,

          description,

          slug,

          status:
            "active",

          responses:
            0,

          questionsCount:
            0,

          createdBy:
            auth.currentUser.uid,

          createdByEmail:
            auth.currentUser.email ||
            "",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }

      );


      surveyTitle.value =
        "";

      surveyDescription.value =
        "";

      surveySlug.value =
        "";


      showToast(
        "تم إنشاء الاستبانة بنجاح ✅"
      );


      await loadSurveys();

    }

    catch (error) {

      console.error(
        "Create survey error:",
        error
      );


      showToast(
        "حدث خطأ أثناء إنشاء الاستبانة"
      );

    }

    finally {

      createSurveyBtn.disabled =
        false;


      createSurveyBtn.textContent =
        "+ إنشاء الاستبانة";

    }

  }
);


// ======================================================
// تحميل الاستبانات
// ======================================================

async function loadSurveys() {

  if (
    !auth.currentUser
  ) {

    return;

  }


  try {

    surveyList.innerHTML = `

      <div class="empty-state">

        <div class="icon">
          ⏳
        </div>

        <p>
          جاري تحميل الاستبانات...
        </p>

      </div>

    `;


    const surveysQuery =
      query(

        collection(
          db,
          "surveys"
        ),

        orderBy(
          "createdAt",
          "desc"
        )

      );


    const snapshot =
      await getDocs(
        surveysQuery
      );


    surveys =
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


    renderSurveys();

  }

  catch (error) {

    console.error(
      "Load surveys error:",
      error
    );


    surveyList.innerHTML = `

      <div class="empty-state">

        <div class="icon">
          ⚠️
        </div>

        <p>
          تعذر تحميل الاستبانات
        </p>

      </div>

    `;


    showToast(
      "تعذر الاتصال بقاعدة البيانات"
    );

  }

}


// ======================================================
// عرض الاستبانات
// ======================================================

function renderSurveys() {

  surveyList.innerHTML =
    "";


  if (
    surveys.length === 0
  ) {

    surveyList.innerHTML = `

      <div class="empty-state">

        <div class="icon">
          📭
        </div>

        <p>
          لا توجد استبانات حتى الآن.
        </p>

      </div>

    `;


    updateStats();

    return;

  }


  surveys.forEach(
    survey => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "survey-item";


      const isActive =
        survey.status ===
        "active";


      const safeTitle =
        escapeHtml(
          survey.title ||
          ""
        );


      const safeDescription =
        survey.description
          ?
          escapeHtml(
            survey.description
          )
          :
          "بدون وصف";


      const safeSlug =
        escapeHtml(
          survey.slug ||
          ""
        );


      const questionsCount =
        Number(
          survey.questionsCount ||
          0
        );


      const responses =
        Number(
          survey.responses ||
          0
        );


      const statusText =
        isActive
          ?
          "نشطة"
          :
          "مغلقة";


      const statusStyle =
        isActive

          ?

          `
          background:#dcfce7;
          color:#15803d;
          `

          :

          `
          background:#fee2e2;
          color:#b91c1c;
          `;


      const toggleText =
        isActive
          ?
          "🔒 إغلاق"
          :
          "🔓 فتح";


      const toggleStyle =
        isActive

          ?

          `
          background:#fff7ed;
          color:#c2410c;
          `

          :

          `
          background:#ecfdf5;
          color:#047857;
          `;


      card.innerHTML = `

        <div class="survey-item-top">

          <div>

            <h3>
              ${safeTitle}
            </h3>


            <p>
              ${safeDescription}
            </p>


            <div
              style="
                margin-top:10px;
                display:flex;
                flex-wrap:wrap;
                gap:7px;
              "
            >


              <span
                style="
                  background:#f3f4f6;
                  border-radius:8px;
                  padding:5px 9px;
                  font-size:10px;
                  color:#66697b;
                  direction:ltr;
                "
              >
                🔗 ${safeSlug}
              </span>


              <span
                style="
                  background:#eef2ff;
                  border-radius:8px;
                  padding:5px 9px;
                  font-size:10px;
                  color:#4f46e5;
                "
              >
                ❓ ${questionsCount}
                سؤال
              </span>


              <span
                style="
                  background:#ecfdf5;
                  border-radius:8px;
                  padding:5px 9px;
                  font-size:10px;
                  color:#047857;
                "
              >
                👥 ${responses}
                مشاركة
              </span>


            </div>

          </div>


          <span
            class="status-badge"
            style="${statusStyle}"
          >
            ${statusText}
          </span>

        </div>


        <div class="survey-actions">


          <button

            class="
              small-btn
              edit-btn
            "

            data-action="questions"

            data-id="${survey.id}"

          >
            🧩 تصميم الأسئلة
          </button>


          <button

            class="small-btn"

            data-action="settings"

            data-id="${survey.id}"

            style="
              background:#fef3c7;
              color:#92400e;
            "

          >
            ✏️ تعديل
          </button>


          <button

            class="
              small-btn
              results-btn
            "

            data-action="results"

            data-id="${survey.id}"

          >
            📊 النتائج
          </button>


          <button

            class="small-btn"

            data-action="copy"

            data-id="${survey.id}"

            style="
              background:#ecfeff;
              color:#0e7490;
            "

          >
            🔗 نسخ الرابط
          </button>


          <button

            class="small-btn"

            data-action="qr"

            data-id="${survey.id}"

            style="
              background:#f0fdf4;
              color:#15803d;
            "

          >
            📱 QR Code
          </button>


          <button

            class="small-btn"

            data-action="toggle"

            data-id="${survey.id}"

            style="${toggleStyle}"

          >
            ${toggleText}
          </button>


          <button

            class="
              small-btn
              delete-btn
            "

            data-action="delete"

            data-id="${survey.id}"

          >
            🗑️ حذف
          </button>


        </div>

      `;


      surveyList.appendChild(
        card
      );

    }
  );


  updateStats();

}


// ======================================================
// أحداث البطاقات
// ======================================================

surveyList.addEventListener(
  "click",
  async event => {

    const button =
      event.target.closest(
        "button[data-action]"
      );


    if (!button) {
      return;
    }


    const survey =
      surveys.find(
        item =>
          item.id ===
          button.dataset.id
      );


    if (!survey) {
      return;
    }


    const action =
      button.dataset.action;


    if (
      action ===
      "questions"
    ) {

      window.location.href =
        `builder.html?id=${survey.id}`;

      return;

    }


    if (
      action ===
      "settings"
    ) {

      openEditSurvey(
        survey
      );

      return;

    }


    if (
      action ===
      "results"
    ) {

      window.location.href =
        `results.html?id=${survey.id}`;

      return;

    }


    if (
      action ===
      "copy"
    ) {

      await copySurveyLink(
        survey
      );

      return;

    }


    if (
      action ===
      "qr"
    ) {

      openQrModal(
        survey
      );

      return;

    }


    if (
      action ===
      "toggle"
    ) {

      await toggleSurveyStatus(
        survey
      );

      return;

    }


    if (
      action ===
      "delete"
    ) {

      await deleteSurvey(
        survey
      );

    }

  }
);


// ======================================================
// التعديل
// ======================================================

function openEditSurvey(
  survey
) {

  editingSurveyId =
    survey.id;


  editSurveyTitle.value =
    survey.title ||
    "";


  editSurveyDescription.value =
    survey.description ||
    "";


  editSurveySlug.value =
    survey.slug ||
    "";


  editSurveyModal.classList.add(
    "show"
  );

}


function closeEditSurvey() {

  editingSurveyId =
    null;


  editSurveyModal.classList.remove(
    "show"
  );

}


closeEditModal.addEventListener(
  "click",
  closeEditSurvey
);


cancelSurveyEditBtn.addEventListener(
  "click",
  closeEditSurvey
);


editSurveyModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      editSurveyModal
    ) {

      closeEditSurvey();

    }

  }
);


saveSurveyEditBtn.addEventListener(
  "click",
  saveSurveyEdit
);


async function saveSurveyEdit() {

  if (
    !editingSurveyId ||
    !auth.currentUser
  ) {

    return;

  }


  const title =
    editSurveyTitle
      .value
      .trim();


  const description =
    editSurveyDescription
      .value
      .trim();


  const slug =
    cleanSlug(
      editSurveySlug.value
    );


  if (!title) {

    showToast(
      "اكتب عنوان الاستبانة"
    );

    return;

  }


  if (!slug) {

    showToast(
      "اكتب رابطًا صحيحًا"
    );

    return;

  }


  const exists =
    surveys.some(
      survey =>

        survey.id !==
          editingSurveyId &&

        survey.slug ===
          slug
    );


  if (exists) {

    showToast(
      "الرابط مستخدم في استبانة أخرى"
    );

    return;

  }


  try {

    saveSurveyEditBtn.disabled =
      true;


    saveSurveyEditBtn.textContent =
      "جاري الحفظ...";


    await updateDoc(

      doc(
        db,
        "surveys",
        editingSurveyId
      ),

      {

        title,

        description,

        slug,

        updatedAt:
          serverTimestamp(),

        updatedBy:
          auth.currentUser.uid

      }

    );


    closeEditSurvey();


    showToast(
      "تم تعديل الاستبانة ✅"
    );


    await loadSurveys();

  }

  catch (error) {

    console.error(
      "Edit error:",
      error
    );


    showToast(
      "تعذر حفظ التعديلات"
    );

  }

  finally {

    saveSurveyEditBtn.disabled =
      false;


    saveSurveyEditBtn.textContent =
      "💾 حفظ التعديلات";

  }

}


// ======================================================
// فتح / إغلاق
// ======================================================

async function toggleSurveyStatus(
  survey
) {

  if (
    !auth.currentUser
  ) {

    return;

  }


  const isActive =
    survey.status ===
    "active";


  const newStatus =
    isActive
      ?
      "closed"
      :
      "active";


  if (
    !confirm(

      isActive

        ?

        `هل تريد إغلاق "${survey.title}"؟`

        :

        `هل تريد فتح "${survey.title}"؟`

    )
  ) {

    return;

  }


  try {

    await updateDoc(

      doc(
        db,
        "surveys",
        survey.id
      ),

      {

        status:
          newStatus,

        updatedAt:
          serverTimestamp(),

        updatedBy:
          auth.currentUser.uid

      }

    );


    showToast(

      newStatus ===
      "active"

        ?

        "تم فتح الاستبانة ✅"

        :

        "تم إغلاق الاستبانة 🔒"

    );


    await loadSurveys();

  }

  catch (error) {

    console.error(
      error
    );


    showToast(
      "تعذر تغيير حالة الاستبانة"
    );

  }

}


// ======================================================
// رابط الاستبانة
// ======================================================

function getSurveyUrl(
  survey
) {

  const url =
    new URL(
      "survey.html",
      window.location.href
    );


  url.searchParams.set(
    "s",
    survey.slug
  );


  return url.href;

}


// ======================================================
// نسخ الرابط
// ======================================================

async function copySurveyLink(
  survey
) {

  const url =
    getSurveyUrl(
      survey
    );


  try {

    await navigator.clipboard
      .writeText(
        url
      );


    showToast(
      "تم نسخ الرابط 🔗"
    );

  }

  catch {

    prompt(
      "انسخ الرابط:",
      url
    );

  }

}


// ======================================================
// QR Code
// ======================================================

function openQrModal(
  survey
) {

  currentQrUrl =
    getSurveyUrl(
      survey
    );


  qrSurveyTitle.textContent =
    survey.title ||
    "الاستبانة";


  qrSurveyUrl.textContent =
    currentQrUrl;


  qrCode.innerHTML =
    "";


  if (
    typeof QRCode ===
    "undefined"
  ) {

    showToast(
      "تعذر تحميل QR Code"
    );

    return;

  }


  new QRCode(
    qrCode,
    {

      text:
        currentQrUrl,

      width:
        200,

      height:
        200,

      correctLevel:
        QRCode.CorrectLevel.H

    }
  );


  qrModal.classList.add(
    "show"
  );

}


function hideQrModal() {

  qrModal.classList.remove(
    "show"
  );

}


closeQrModal.addEventListener(
  "click",
  hideQrModal
);


closeQrModalBtn.addEventListener(
  "click",
  hideQrModal
);


qrModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      qrModal
    ) {

      hideQrModal();

    }

  }
);


copyQrLinkBtn.addEventListener(
  "click",
  async () => {

    if (!currentQrUrl) {
      return;
    }


    try {

      await navigator.clipboard
        .writeText(
          currentQrUrl
        );


      showToast(
        "تم نسخ الرابط 🔗"
      );

    }

    catch {

      prompt(
        "انسخ الرابط:",
        currentQrUrl
      );

    }

  }
);


// ======================================================
// حذف
// ======================================================

async function deleteSurvey(
  survey
) {

  if (
    !auth.currentUser
  ) {

    return;

  }


  const confirmed =
    confirm(

      "هل تريد حذف الاستبانة؟\n\n" +

      survey.title +

      "\n\nلا يمكن التراجع عن هذا الإجراء."

    );


  if (!confirmed) {
    return;
  }


  try {

    await deleteDoc(

      doc(
        db,
        "surveys",
        survey.id
      )

    );


    showToast(
      "تم حذف الاستبانة"
    );


    await loadSurveys();

  }

  catch (error) {

    console.error(
      error
    );


    showToast(
      "تعذر حذف الاستبانة"
    );

  }

}


// ======================================================
// الإحصاءات
// ======================================================

function updateStats() {

  surveyCount.textContent =
    surveys.length;


  activeCount.textContent =
    surveys.filter(
      survey =>
        survey.status ===
        "active"
    ).length;


  responseCount.textContent =
    surveys.reduce(

      (
        sum,
        survey
      ) =>

        sum +
        Number(
          survey.responses ||
          0
        ),

      0

    );

}


// ======================================================
// تنظيف الرابط
// ======================================================

function cleanSlug(
  value
) {

  return String(
    value ||
    ""
  )

    .trim()

    .toLowerCase()

    .replace(
      /\s+/g,
      "-"
    )

    .replace(
      /[^a-z0-9-_]/g,
      ""
    );

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
// Toast
// ======================================================

function showToast(
  message
) {

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
// Escape
// ======================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !==
      "Escape"
    ) {

      return;

    }


    closeEditSurvey();

    hideQrModal();

  }
);


// ======================================================
// تنظيف listeners
// ======================================================

window.addEventListener(
  "beforeunload",
  () => {

    if (
      typeof unsubscribeAuth ===
      "function"
    ) {

      unsubscribeAuth();

    }

  }
);
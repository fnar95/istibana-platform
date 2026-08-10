// ======================================================
// survey.js
// صفحة المشاركة + حالة الاستبانة المغلقة
// ======================================================

import {

  db,

  collection,
  doc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  increment

} from "./firebase-config.js";


// ======================================================
// عناصر الصفحة
// ======================================================

const loadingState =
  document.getElementById(
    "loadingState"
  );


const surveyCard =
  document.getElementById(
    "surveyCard"
  );


const surveyTitle =
  document.getElementById(
    "surveyTitle"
  );


const surveyDescription =
  document.getElementById(
    "surveyDescription"
  );


const surveyForm =
  document.getElementById(
    "surveyForm"
  );


const questionsContainer =
  document.getElementById(
    "questionsContainer"
  );


const submitBtn =
  document.getElementById(
    "submitBtn"
  );


const progressFill =
  document.getElementById(
    "progressFill"
  );


const progressPercent =
  document.getElementById(
    "progressPercent"
  );


const closedScreen =
  document.getElementById(
    "closedScreen"
  );


const closedSurveyTitle =
  document.getElementById(
    "closedSurveyTitle"
  );


const successScreen =
  document.getElementById(
    "successScreen"
  );


const toast =
  document.getElementById(
    "toast"
  );


// ======================================================
// الرابط
// ======================================================

const params =
  new URLSearchParams(
    window.location.search
  );


const slug =
  params.get("s");


// ======================================================
// البيانات
// ======================================================

let currentSurvey =
  null;


let questions =
  [];


// ======================================================
// البداية
// ======================================================

init();


// ======================================================
// تحميل الاستبانة
// ======================================================

async function init() {

  if (!slug) {

    showError(
      "رابط الاستبانة غير صحيح."
    );

    return;

  }


  try {

    const surveyQuery =
      query(

        collection(
          db,
          "surveys"
        ),

        where(
          "slug",
          "==",
          slug
        )

      );


    const snapshot =
      await getDocs(
        surveyQuery
      );


    if (
      snapshot.empty
    ) {

      showError(
        "لم يتم العثور على هذه الاستبانة."
      );

      return;

    }


    const surveyDocument =
      snapshot.docs[0];


    currentSurvey = {

      id:
        surveyDocument.id,

      ...surveyDocument.data()

    };


    // ======================================
    // إخفاء التحميل
    // ======================================

    loadingState.style.display =
      "none";


    // ======================================
    // الاستبانة مغلقة
    // ======================================

    if (
      currentSurvey.status !==
      "active"
    ) {

      showClosedSurvey();

      return;

    }


    // ======================================
    // الاستبانة نشطة
    // ======================================

    questions =
      Array.isArray(
        currentSurvey.questions
      )
        ?
        currentSurvey.questions
        :
        [];


    renderSurvey();

  }

  catch (error) {

    console.error(
      "Load survey error:",
      error
    );


    showError(
      "تعذر تحميل الاستبانة. حاول مرة أخرى."
    );

  }

}


// ======================================================
// حالة الاستبانة المغلقة
// ======================================================

function showClosedSurvey() {

  surveyCard.hidden =
    true;


  successScreen.classList.remove(
    "show"
  );


  closedSurveyTitle.textContent =
    currentSurvey?.title ||
    "الاستبانة";


  document.title =
    `${
      currentSurvey?.title ||
      "الاستبانة"
    } | انتهى استقبال المشاركات`;


  closedScreen.classList.add(
    "show"
  );

}


// ======================================================
// عرض الاستبانة
// ======================================================

function renderSurvey() {

  surveyTitle.textContent =
    currentSurvey.title ||
    "استبانة";


  surveyDescription.textContent =
    currentSurvey.description ||
    "شاركنا رأيك من خلال هذه الاستبانة.";


  document.title =
    currentSurvey.title ||
    "الاستبانة";


  questionsContainer.innerHTML =
    "";


  if (
    questions.length === 0
  ) {

    questionsContainer.innerHTML = `

      <div
        style="
          text-align:center;
          padding:35px 20px;
          color:#999bad;
          font-size:11px;
        "
      >

        📭 لا توجد أسئلة
        في هذه الاستبانة حتى الآن.

      </div>

    `;


    submitBtn.disabled =
      true;

  }

  else {

    questions.forEach(
      (
        question,
        index
      ) => {

        questionsContainer
          .appendChild(
            buildQuestion(
              question,
              index
            )
          );

      }
    );

  }


  surveyCard.hidden =
    false;


  updateProgress();

}


// ======================================================
// بناء السؤال
// ======================================================

function buildQuestion(
  question,
  index
) {

  const card =
    document.createElement(
      "div"
    );


  card.className =
    "question-card";


  const requiredMark =
    question.required
      ?
      `<span class="required-mark">*</span>`
      :
      "";


  card.innerHTML = `

    <div class="question-title-row">

      <div class="question-number">
        ${index + 1}
      </div>

      <div class="question-title">

        ${escapeHtml(
          question.text ||
          "سؤال"
        )}

        ${requiredMark}

      </div>

    </div>


    <div
      class="question-field"
      data-question-id="${question.id}"
    >

      ${buildQuestionField(
        question
      )}

    </div>

  `;


  return card;

}


// ======================================================
// نوع السؤال
// ======================================================

function buildQuestionField(
  question
) {

  const questionName =
    `question-${question.id}`;


  // ======================================
  // اختيار واحد
  // ======================================

  if (
    question.type ===
    "radio"
  ) {

    return getOptions(
      question
    )
      .map(
        option => `

          <label class="option-item">

            <input
              type="radio"
              name="${questionName}"
              value="${escapeAttribute(option)}"
            >

            <span>
              ${escapeHtml(option)}
            </span>

          </label>

        `
      )
      .join("");

  }


  // ======================================
  // اختيار متعدد
  // ======================================

  if (
    question.type ===
    "checkbox"
  ) {

    return getOptions(
      question
    )
      .map(
        option => `

          <label class="option-item">

            <input
              type="checkbox"
              name="${questionName}"
              value="${escapeAttribute(option)}"
            >

            <span>
              ${escapeHtml(option)}
            </span>

          </label>

        `
      )
      .join("");

  }


  // ======================================
  // نعم / لا
  // ======================================

  if (
    question.type ===
    "yes-no"
  ) {

    return [

      "نعم",
      "لا"

    ]
      .map(
        option => `

          <label class="option-item">

            <input
              type="radio"
              name="${questionName}"
              value="${option}"
            >

            <span>
              ${option}
            </span>

          </label>

        `
      )
      .join("");

  }


  // ======================================
  // تقييم
  // ======================================

  if (
    question.type ===
    "rating"
  ) {

    const options =
      getOptions(
        question
      );


    return `

      <div class="rating-row">

        ${options
          .map(
            option => `

              <label class="rating-option">

                <input
                  type="radio"
                  name="${questionName}"
                  value="${escapeAttribute(option)}"
                >

                <span>
                  ${escapeHtml(option)}
                </span>

              </label>

            `
          )
          .join("")}

      </div>

    `;

  }


  // ======================================
  // إجابة طويلة
  // ======================================

  if (
    question.type ===
    "long-text"
  ) {

    return `

      <textarea
        class="text-input"
        name="${questionName}"
        placeholder="اكتب إجابتك هنا..."
      ></textarea>

    `;

  }


  // ======================================
  // إجابة قصيرة
  // ======================================

  return `

    <input
      class="text-input"
      type="text"
      name="${questionName}"
      placeholder="اكتب إجابتك هنا..."
    >

  `;

}


// ======================================================
// الخيارات
// ======================================================

function getOptions(
  question
) {

  if (
    Array.isArray(
      question.options
    ) &&
    question.options.length > 0
  ) {

    return question.options;

  }


  if (
    question.type ===
    "rating"
  ) {

    return [
      "1",
      "2",
      "3",
      "4",
      "5"
    ];

  }


  return [];

}


// ======================================================
// تحديث نسبة الإنجاز
// ======================================================

function updateProgress() {

  if (
    questions.length === 0
  ) {

    progressPercent.textContent =
      "0%";


    progressFill.style.width =
      "0%";


    return;

  }


  let answered =
    0;


  questions.forEach(
    question => {

      const value =
        getAnswerValue(
          question
        );


      if (
        isAnswered(
          value
        )
      ) {

        answered++;

      }

    }
  );


  const percent =
    Math.round(
      (
        answered /
        questions.length
      ) *
      100
    );


  progressPercent.textContent =
    `${percent}%`;


  progressFill.style.width =
    `${percent}%`;

}


// ======================================================
// مراقبة الإجابات
// ======================================================

surveyForm.addEventListener(
  "input",
  updateProgress
);


surveyForm.addEventListener(
  "change",
  updateProgress
);


// ======================================================
// قراءة إجابة سؤال
// ======================================================

function getAnswerValue(
  question
) {

  const name =
    `question-${question.id}`;


  if (
    question.type ===
    "checkbox"
  ) {

    return Array.from(
      document.querySelectorAll(
        `input[name="${name}"]:checked`
      )
    )
      .map(
        input =>
          input.value
      );

  }


  if (
    question.type ===
      "radio" ||
    question.type ===
      "yes-no" ||
    question.type ===
      "rating"
  ) {

    const checked =
      document.querySelector(
        `input[name="${name}"]:checked`
      );


    return checked
      ?
      checked.value
      :
      "";

  }


  const field =
    document.querySelector(
      `[name="${name}"]`
    );


  return field
    ?
    field.value.trim()
    :
    "";

}


// ======================================================
// الإرسال
// ======================================================

surveyForm.addEventListener(
  "submit",
  submitSurvey
);


async function submitSurvey(
  event
) {

  event.preventDefault();


  if (
    !currentSurvey
  ) {

    return;

  }


  // ======================================
  // تحقق إضافي:
  // الحالة الموجودة في الذاكرة
  // ======================================

  if (
    currentSurvey.status !==
    "active"
  ) {

    showClosedSurvey();

    return;

  }


  const answers =
    [];


  // ======================================
  // التحقق من المطلوبة
  // ======================================

  for (
    const question
    of questions
  ) {

    const value =
      getAnswerValue(
        question
      );


    if (
      question.required &&
      !isAnswered(value)
    ) {

      showToast(
        `يرجى الإجابة على السؤال: ${
          question.text ||
          ""
        }`
      );


      return;

    }


    answers.push({

      questionId:
        question.id,

      questionText:
        question.text ||
        "",

      questionType:
        question.type ||
        "",

      value

    });

  }


  try {

    submitBtn.disabled =
      true;


    submitBtn.textContent =
      "⏳ جاري إرسال المشاركة...";


    // ======================================
    // Batch
    // ======================================

    const batch =
      writeBatch(
        db
      );


    // ======================================
    // مستند المشاركة
    // ======================================

    const responseRef =
      doc(
        collection(
          db,
          "surveys",
          currentSurvey.id,
          "responses"
        )
      );


    batch.set(
      responseRef,
      {

        surveyId:
          currentSurvey.id,

        surveySlug:
          currentSurvey.slug ||
          "",

        surveyTitle:
          currentSurvey.title ||
          "",

        answers,

        submittedAt:
          serverTimestamp()

      }
    );


    // ======================================
    // تحديث العداد
    // ======================================

    const surveyRef =
      doc(
        db,
        "surveys",
        currentSurvey.id
      );


    batch.update(
      surveyRef,
      {

        responses:
          increment(1),

        lastResponseAt:
          serverTimestamp()

      }
    );


    // ======================================
    // Commit
    // ======================================

    await batch.commit();


    // ======================================
    // نجاح
    // ======================================

    surveyCard.hidden =
      true;


    closedScreen.classList.remove(
      "show"
    );


    successScreen.classList.add(
      "show"
    );


    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });

  }

  catch (error) {

    console.error(
      "Submit survey error:",
      error
    );


    // ======================================
    // مهم:
    // إذا أغلقت الإدارة الاستبانة
    // أثناء وجود المشارك داخلها،
    // سترفض Firestore عملية الإرسال.
    // ======================================

    if (
      error?.code ===
      "permission-denied"
    ) {

      currentSurvey.status =
        "closed";


      surveyCard.hidden =
        true;


      successScreen.classList.remove(
        "show"
      );


      closedSurveyTitle.textContent =
        currentSurvey.title ||
        "الاستبانة";


      closedScreen.classList.add(
        "show"
      );


      showToast(
        "تم إغلاق الاستبانة وانتهى استقبال المشاركات."
      );


      return;

    }


    showToast(
      "تعذر إرسال المشاركة، حاول مرة أخرى."
    );

  }

  finally {

    submitBtn.disabled =
      false;


    submitBtn.textContent =
      "✅ إرسال المشاركة";

  }

}


// ======================================================
// هل تمت الإجابة؟
 // ======================================================

function isAnswered(
  value
) {

  if (
    Array.isArray(
      value
    )
  ) {

    return (
      value.length > 0
    );

  }


  if (
    value === null ||
    value === undefined
  ) {

    return false;

  }


  return (
    String(value)
      .trim()
      .length > 0
  );

}


// ======================================================
// خطأ
// ======================================================

function showError(
  message
) {

  loadingState.innerHTML = `

    <div class="state-icon">
      ⚠️
    </div>

    <h2>
      تعذر فتح الاستبانة
    </h2>

    <p>
      ${escapeHtml(
        message
      )}
    </p>

  `;

}


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
    2600
  );

}


// ======================================================
// حماية HTML
// ======================================================

function escapeHtml(
  value
) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    value ??
    "";


  return div.innerHTML;

}


// ======================================================
// حماية Attributes
// ======================================================

function escapeAttribute(
  value
) {

  return String(
    value ??
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
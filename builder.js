// ======================================================
// builder.js
// محرر أسئلة منصة الاستبانات
// ======================================================

import {
  db,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "./firebase-config.js";


// ======================================================
// عناصر الصفحة
// ======================================================

const surveyTitleDisplay =
  document.getElementById("surveyTitleDisplay");

const surveyDescriptionDisplay =
  document.getElementById("surveyDescriptionDisplay");

const questionsContainer =
  document.getElementById("questionsContainer");

const questionsCount =
  document.getElementById("questionsCount");

const saveQuestionsBtn =
  document.getElementById("saveQuestionsBtn");

const saveStatus =
  document.getElementById("saveStatus");

const previewBtn =
  document.getElementById("previewBtn");

const toast =
  document.getElementById("toast");


// ======================================================
// قراءة ID الاستبانة من الرابط
// ======================================================

const urlParams =
  new URLSearchParams(window.location.search);

const surveyId =
  urlParams.get("id");


// ======================================================
// المتغيرات
// ======================================================

let currentSurvey = null;

let questions = [];

let hasChanges = false;


// ======================================================
// بداية التشغيل
// ======================================================

init();


// ======================================================
// تهيئة الصفحة
// ======================================================

async function init() {

  console.log(
    "Builder started..."
  );

  console.log(
    "Survey ID:",
    surveyId
  );


  if (!surveyId) {

    surveyTitleDisplay.textContent =
      "لم يتم تحديد الاستبانة";

    surveyDescriptionDisplay.textContent =
      "ارجع إلى لوحة الإدارة وافتح الاستبانة من زر تصميم الأسئلة.";

    disableBuilder();

    return;

  }


  await loadSurvey();

}


// ======================================================
// تحميل بيانات الاستبانة
// ======================================================

async function loadSurvey() {

  try {

    surveyTitleDisplay.textContent =
      "جاري تحميل الاستبانة...";

    surveyDescriptionDisplay.textContent =
      "يرجى الانتظار أثناء جلب البيانات من Firebase.";


    const surveyRef =
      doc(
        db,
        "surveys",
        surveyId
      );


    const surveySnapshot =
      await getDoc(
        surveyRef
      );


    if (!surveySnapshot.exists()) {

      surveyTitleDisplay.textContent =
        "الاستبانة غير موجودة";

      surveyDescriptionDisplay.textContent =
        "لم نعثر على هذه الاستبانة في قاعدة البيانات.";

      disableBuilder();

      return;

    }


    currentSurvey = {

      id:
        surveySnapshot.id,

      ...surveySnapshot.data()

    };


    console.log(
      "Survey loaded:",
      currentSurvey
    );


    // عرض العنوان

    surveyTitleDisplay.textContent =
      currentSurvey.title ||
      "استبانة بدون عنوان";


    // عرض الوصف

    surveyDescriptionDisplay.textContent =
      currentSurvey.description ||
      "لا يوجد وصف لهذه الاستبانة.";


    // تحميل الأسئلة السابقة

    if (
      Array.isArray(
        currentSurvey.questions
      )
    ) {

      questions =
        currentSurvey.questions;

    } else {

      questions = [];

    }


    // التأكد من سلامة بيانات الأسئلة القديمة

    questions =
      questions.map(
        question => ({

          id:
            question.id ||
            generateId(),

          type:
            question.type ||
            "radio",

          text:
            question.text ||
            "",

          required:
            Boolean(
              question.required
            ),

          options:
            Array.isArray(
              question.options
            )
              ?
              question.options
              :
              getDefaultOptions(
                question.type ||
                "radio"
              )

        })
      );


    renderQuestions();


    saveStatus.textContent =
      "تم تحميل الاستبانة بنجاح";


    hasChanges =
      false;

  }

  catch (error) {

    console.error(
      "Load survey error:",
      error
    );


    surveyTitleDisplay.textContent =
      "تعذر تحميل الاستبانة";


    surveyDescriptionDisplay.textContent =
      "حدث خطأ أثناء الاتصال بقاعدة البيانات.";


    showToast(
      "تعذر تحميل الاستبانة"
    );

  }

}


// ======================================================
// أزرار إضافة أنواع الأسئلة
// ======================================================

document
  .querySelectorAll(
    "[data-question-type]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const type =
            button.dataset.questionType;


          addQuestion(
            type
          );

        }
      );

    }
  );


// ======================================================
// إضافة سؤال
// ======================================================

function addQuestion(type) {

  if (!currentSurvey) {

    showToast(
      "انتظر حتى يتم تحميل الاستبانة"
    );

    return;

  }


  const question = {

    id:
      generateId(),

    type:
      type,

    text:
      "",

    required:
      false,

    options:
      getDefaultOptions(
        type
      )

  };


  questions.push(
    question
  );


  markChanged();


  renderQuestions();


  // الانتقال إلى السؤال الجديد

  setTimeout(
    () => {

      const cards =
        document.querySelectorAll(
          ".question-card"
        );


      if (
        cards.length > 0
      ) {

        const lastCard =
          cards[
            cards.length - 1
          ];


        lastCard.scrollIntoView({

          behavior:
            "smooth",

          block:
            "center"

        });


        const input =
          lastCard.querySelector(
            ".question-text-input"
          );


        if (input) {

          input.focus();

        }

      }

    },
    100
  );

}


// ======================================================
// الخيارات الافتراضية حسب نوع السؤال
// ======================================================

function getDefaultOptions(type) {

  switch (type) {

    case "radio":

      return [
        "الخيار 1",
        "الخيار 2"
      ];


    case "checkbox":

      return [
        "الخيار 1",
        "الخيار 2"
      ];


    case "yes-no":

      return [
        "نعم",
        "لا"
      ];


    case "rating":

      return [
        "1",
        "2",
        "3",
        "4",
        "5"
      ];


    case "short-text":

      return [];


    case "long-text":

      return [];


    default:

      return [];

  }

}


// ======================================================
// عرض جميع الأسئلة
// ======================================================

function renderQuestions() {

  questionsContainer.innerHTML =
    "";


  updateQuestionsCount();


  // لا توجد أسئلة

  if (
    questions.length === 0
  ) {

    questionsContainer.innerHTML = `

      <div
        id="emptyQuestionsState"
        class="empty-state"
      >

        <div class="empty-icon">
          ❓
        </div>

        <h4>
          لم تضف أي سؤال بعد
        </h4>

        <p>
          اختر نوع السؤال من القائمة
          لإضافة أول سؤال إلى الاستبانة.
        </p>

      </div>

    `;


    return;

  }


  // إنشاء البطاقات

  questions.forEach(
    (
      question,
      index
    ) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "question-card";


      card.dataset.id =
        question.id;


      card.innerHTML =
        buildQuestionCard(
          question,
          index
        );


      questionsContainer
        .appendChild(
          card
        );

    }
  );


  attachQuestionEvents();

}


// ======================================================
// إنشاء HTML الخاص بالسؤال
// ======================================================

function buildQuestionCard(
  question,
  index
) {

  return `

    <div class="question-number">

      سؤال ${index + 1}

    </div>


    <div class="question-row">


      <input

        type="text"

        class="
          field-input
          question-text-input
        "

        data-id="${question.id}"

        value="${escapeAttribute(
          question.text
        )}"

        placeholder="اكتب نص السؤال هنا..."

      >


      <select

        class="
          field-input
          question-type-select
        "

        data-id="${question.id}"

      >

        ${getQuestionTypesHtml(
          question.type
        )}

      </select>


    </div>


    ${buildOptionsArea(
      question
    )}


    <div class="question-footer">


      <label
        class="required-control"
      >

        <input

          type="checkbox"

          class="required-checkbox"

          data-id="${question.id}"

          ${
            question.required
              ?
              "checked"
              :
              ""
          }

        >

        سؤال إلزامي

      </label>


      <button

        type="button"

        class="
          icon-btn
          move-up-btn
        "

        data-id="${question.id}"

        title="تحريك السؤال لأعلى"

      >
        ↑
      </button>


      <button

        type="button"

        class="
          icon-btn
          move-down-btn
        "

        data-id="${question.id}"

        title="تحريك السؤال لأسفل"

      >
        ↓
      </button>


      <button

        type="button"

        class="
          icon-btn
          duplicate-question-btn
        "

        data-id="${question.id}"

        title="تكرار السؤال"

      >
        📄
      </button>


      <button

        type="button"

        class="
          icon-btn
          delete-question-btn
        "

        data-id="${question.id}"

        title="حذف السؤال"

      >
        🗑️
      </button>


    </div>

  `;

}


// ======================================================
// أنواع الأسئلة
// ======================================================

function getQuestionTypesHtml(
  selectedType
) {

  const types = [

    {
      value:
        "radio",

      label:
        "اختيار واحد"
    },

    {
      value:
        "checkbox",

      label:
        "اختيار متعدد"
    },

    {
      value:
        "short-text",

      label:
        "إجابة قصيرة"
    },

    {
      value:
        "long-text",

      label:
        "إجابة طويلة"
    },

    {
      value:
        "yes-no",

      label:
        "نعم / لا"
    },

    {
      value:
        "rating",

      label:
        "مقياس تقييم"
    }

  ];


  return types
    .map(
      type => `

        <option

          value="${type.value}"

          ${
            type.value ===
            selectedType
              ?
              "selected"
              :
              ""
          }

        >

          ${type.label}

        </option>

      `
    )
    .join("");

}


// ======================================================
// إنشاء منطقة الخيارات
// ======================================================

function buildOptionsArea(
  question
) {

  // ----------------------------------------
  // إجابة قصيرة
  // ----------------------------------------

  if (
    question.type ===
    "short-text"
  ) {

    return `

      <div
        style="
          background:#f8f8fc;
          border:1px dashed #e1e1ec;
          padding:13px;
          border-radius:10px;
          color:#999bad;
          font-size:11px;
          margin-bottom:12px;
        "
      >

        ✏️ سيظهر للمشارك حقل
        لإدخال إجابة قصيرة.

      </div>

    `;

  }


  // ----------------------------------------
  // إجابة طويلة
  // ----------------------------------------

  if (
    question.type ===
    "long-text"
  ) {

    return `

      <div
        style="
          background:#f8f8fc;
          border:1px dashed #e1e1ec;
          padding:13px;
          border-radius:10px;
          color:#999bad;
          font-size:11px;
          margin-bottom:12px;
        "
      >

        📝 سيظهر للمشارك مربع
        نص لكتابة إجابة طويلة.

      </div>

    `;

  }


  // ----------------------------------------
  // مقياس التقييم
  // ----------------------------------------

  if (
    question.type ===
    "rating"
  ) {

    return `

      <div
        style="
          background:#f8f8fc;
          border:1px solid #eeeeF5;
          padding:14px;
          border-radius:11px;
          margin-bottom:12px;
        "
      >

        <div
          style="
            margin-bottom:10px;
            font-size:11px;
            font-weight:800;
            color:#66687b;
          "
        >
          معاينة مقياس التقييم
        </div>


        <div
          style="
            display:flex;
            gap:7px;
            flex-wrap:wrap;
          "
        >

          ${question.options
            .map(
              option => `

                <span
                  style="
                    min-width:45px;
                    flex:1;
                    background:white;
                    border:1px solid #e5e5ee;
                    padding:9px;
                    border-radius:9px;
                    text-align:center;
                    font-size:11px;
                  "
                >

                  ⭐ ${escapeHtml(
                    option
                  )}

                </span>

              `
            )
            .join("")}

        </div>

      </div>

    `;

  }


  // ----------------------------------------
  // نعم / لا
  // ----------------------------------------

  if (
    question.type ===
    "yes-no"
  ) {

    return `

      <div
        class="options-container"
      >

        <div class="option-row">

          <span class="option-symbol">
            ○
          </span>

          <input
            class="option-input"
            value="نعم"
            disabled
          >

        </div>


        <div class="option-row">

          <span class="option-symbol">
            ○
          </span>

          <input
            class="option-input"
            value="لا"
            disabled
          >

        </div>

      </div>

    `;

  }


  // ----------------------------------------
  // اختيار واحد / متعدد
  // ----------------------------------------

  const symbol =
    question.type ===
    "checkbox"
      ?
      "□"
      :
      "○";


  let html = `

    <div
      class="options-container"
    >

  `;


  question.options
    .forEach(
      (
        option,
        optionIndex
      ) => {

        html += `

          <div
            class="option-row"
          >


            <span
              class="option-symbol"
            >

              ${symbol}

            </span>


            <input

              type="text"

              class="option-input"

              data-question-id="${question.id}"

              data-option-index="${optionIndex}"

              value="${escapeAttribute(
                option
              )}"

              placeholder="اكتب الخيار..."

            >


            <button

              type="button"

              class="remove-option-btn"

              data-question-id="${question.id}"

              data-option-index="${optionIndex}"

              title="حذف الخيار"

            >

              ×

            </button>


          </div>

        `;

      }
    );


  html += `

    </div>


    <button

      type="button"

      class="add-option-btn"

      data-id="${question.id}"

    >

      + إضافة خيار جديد

    </button>

  `;


  return html;

}


// ======================================================
// ربط أحداث الأسئلة
// ======================================================

function attachQuestionEvents() {

  attachQuestionTextEvents();

  attachQuestionTypeEvents();

  attachRequiredEvents();

  attachOptionInputEvents();

  attachAddOptionEvents();

  attachRemoveOptionEvents();

  attachDeleteQuestionEvents();

  attachDuplicateQuestionEvents();

  attachMoveUpEvents();

  attachMoveDownEvents();

}


// ======================================================
// تعديل نص السؤال
// ======================================================

function attachQuestionTextEvents() {

  document
    .querySelectorAll(
      ".question-text-input"
    )
    .forEach(
      input => {

        input.addEventListener(
          "input",
          event => {

            const id =
              event.target.dataset.id;


            const question =
              findQuestion(
                id
              );


            if (!question) {
              return;
            }


            question.text =
              event.target.value;


            markChanged();

          }
        );

      }
    );

}


// ======================================================
// تغيير نوع السؤال
// ======================================================

function attachQuestionTypeEvents() {

  document
    .querySelectorAll(
      ".question-type-select"
    )
    .forEach(
      select => {

        select.addEventListener(
          "change",
          event => {

            const id =
              event.target.dataset.id;


            const question =
              findQuestion(
                id
              );


            if (!question) {
              return;
            }


            question.type =
              event.target.value;


            question.options =
              getDefaultOptions(
                question.type
              );


            markChanged();


            renderQuestions();

          }
        );

      }
    );

}


// ======================================================
// السؤال الإلزامي
// ======================================================

function attachRequiredEvents() {

  document
    .querySelectorAll(
      ".required-checkbox"
    )
    .forEach(
      checkbox => {

        checkbox.addEventListener(
          "change",
          event => {

            const question =
              findQuestion(
                event.target.dataset.id
              );


            if (!question) {
              return;
            }


            question.required =
              event.target.checked;


            markChanged();

          }
        );

      }
    );

}


// ======================================================
// تعديل الخيارات
// ======================================================

function attachOptionInputEvents() {

  document
    .querySelectorAll(
      ".option-input[data-question-id]"
    )
    .forEach(
      input => {

        input.addEventListener(
          "input",
          event => {

            const questionId =
              event.target.dataset
                .questionId;


            const optionIndex =
              Number(
                event.target.dataset
                  .optionIndex
              );


            const question =
              findQuestion(
                questionId
              );


            if (!question) {
              return;
            }


            question.options[
              optionIndex
            ] =
              event.target.value;


            markChanged();

          }
        );

      }
    );

}


// ======================================================
// إضافة خيار
// ======================================================

function attachAddOptionEvents() {

  document
    .querySelectorAll(
      ".add-option-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const question =
              findQuestion(
                button.dataset.id
              );


            if (!question) {
              return;
            }


            const number =
              question.options.length +
              1;


            question.options.push(
              `الخيار ${number}`
            );


            markChanged();


            renderQuestions();

          }
        );

      }
    );

}


// ======================================================
// حذف خيار
// ======================================================

function attachRemoveOptionEvents() {

  document
    .querySelectorAll(
      ".remove-option-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const questionId =
              button.dataset
                .questionId;


            const optionIndex =
              Number(
                button.dataset
                  .optionIndex
              );


            const question =
              findQuestion(
                questionId
              );


            if (!question) {
              return;
            }


            // يجب بقاء خيارين على الأقل

            if (
              question.options
                .length <= 2
            ) {

              showToast(
                "يجب أن يحتوي السؤال على خيارين على الأقل"
              );

              return;

            }


            question.options.splice(
              optionIndex,
              1
            );


            markChanged();


            renderQuestions();

          }
        );

      }
    );

}


// ======================================================
// حذف السؤال
// ======================================================

function attachDeleteQuestionEvents() {

  document
    .querySelectorAll(
      ".delete-question-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            deleteQuestion(
              button.dataset.id
            );

          }
        );

      }
    );

}


// ======================================================
// تكرار السؤال
// ======================================================

function attachDuplicateQuestionEvents() {

  document
    .querySelectorAll(
      ".duplicate-question-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            duplicateQuestion(
              button.dataset.id
            );

          }
        );

      }
    );

}


// ======================================================
// تحريك السؤال للأعلى
// ======================================================

function attachMoveUpEvents() {

  document
    .querySelectorAll(
      ".move-up-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            moveQuestion(
              button.dataset.id,
              -1
            );

          }
        );

      }
    );

}


// ======================================================
// تحريك السؤال للأسفل
// ======================================================

function attachMoveDownEvents() {

  document
    .querySelectorAll(
      ".move-down-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            moveQuestion(
              button.dataset.id,
              1
            );

          }
        );

      }
    );

}


// ======================================================
// البحث عن سؤال
// ======================================================

function findQuestion(id) {

  return questions.find(
    question =>
      question.id === id
  );

}


// ======================================================
// حذف سؤال
// ======================================================

function deleteQuestion(id) {

  const question =
    findQuestion(
      id
    );


  if (!question) {
    return;
  }


  const confirmed =
    window.confirm(
      "هل تريد حذف هذا السؤال؟"
    );


  if (!confirmed) {
    return;
  }


  questions =
    questions.filter(
      question =>
        question.id !== id
    );


  markChanged();


  renderQuestions();


  showToast(
    "تم حذف السؤال"
  );

}


// ======================================================
// تكرار سؤال
// ======================================================

function duplicateQuestion(id) {

  const index =
    questions.findIndex(
      question =>
        question.id === id
    );


  if (index === -1) {
    return;
  }


  const original =
    questions[index];


  const copy = {

    ...original,

    id:
      generateId(),

    text:
      original.text
        ?
        `${original.text} - نسخة`
        :
        "",

    options:
      Array.isArray(
        original.options
      )
        ?
        [...original.options]
        :
        []

  };


  questions.splice(
    index + 1,
    0,
    copy
  );


  markChanged();


  renderQuestions();


  showToast(
    "تم تكرار السؤال"
  );

}


// ======================================================
// تحريك السؤال
// ======================================================

function moveQuestion(
  id,
  direction
) {

  const index =
    questions.findIndex(
      question =>
        question.id === id
    );


  if (index === -1) {
    return;
  }


  const newIndex =
    index + direction;


  if (
    newIndex < 0 ||
    newIndex >=
      questions.length
  ) {

    return;

  }


  const current =
    questions[index];


  questions[index] =
    questions[newIndex];


  questions[newIndex] =
    current;


  markChanged();


  renderQuestions();

}


// ======================================================
// تحديث عداد الأسئلة
// ======================================================

function updateQuestionsCount() {

  const count =
    questions.length;


  if (count === 0) {

    questionsCount.textContent =
      "0 سؤال";

    return;

  }


  if (count === 1) {

    questionsCount.textContent =
      "1 سؤال";

    return;

  }


  if (
    count >= 3 &&
    count <= 10
  ) {

    questionsCount.textContent =
      `${count} أسئلة`;

    return;

  }


  questionsCount.textContent =
    `${count} سؤال`;

}


// ======================================================
// زر حفظ الأسئلة
// ======================================================

saveQuestionsBtn.addEventListener(
  "click",
  saveQuestions
);


// ======================================================
// حفظ الأسئلة في Firestore
// ======================================================

async function saveQuestions() {

  if (!surveyId) {

    showToast(
      "لم يتم تحديد الاستبانة"
    );

    return;

  }


  // ----------------------------------------
  // التحقق من نصوص الأسئلة
  // ----------------------------------------

  for (
    let index = 0;
    index < questions.length;
    index++
  ) {

    const question =
      questions[index];


    if (
      !question.text ||
      !question.text.trim()
    ) {

      showToast(
        `اكتب نص السؤال رقم ${index + 1}`
      );


      const card =
        document.querySelectorAll(
          ".question-card"
        )[index];


      if (card) {

        card.scrollIntoView({

          behavior:
            "smooth",

          block:
            "center"

        });


        const input =
          card.querySelector(
            ".question-text-input"
          );


        if (input) {

          input.focus();

        }

      }


      return;

    }


    // --------------------------------------
    // التحقق من خيارات الاختيار
    // --------------------------------------

    if (
      question.type ===
        "radio" ||
      question.type ===
        "checkbox"
    ) {

      if (
        question.options.length < 2
      ) {

        showToast(
          `السؤال رقم ${index + 1} يحتاج خيارين على الأقل`
        );

        return;

      }


      const hasEmptyOption =
        question.options.some(
          option =>
            !String(option)
              .trim()
        );


      if (hasEmptyOption) {

        showToast(
          `يوجد خيار فارغ في السؤال رقم ${index + 1}`
        );

        return;

      }

    }

  }


  try {

    saveQuestionsBtn.disabled =
      true;


    saveQuestionsBtn.textContent =
      "جاري الحفظ...";


    saveStatus.textContent =
      "جاري حفظ التغييرات في Firebase...";


    const surveyRef =
      doc(
        db,
        "surveys",
        surveyId
      );


    await updateDoc(
      surveyRef,
      {

        questions:
          questions,

        questionsCount:
          questions.length,

        updatedAt:
          serverTimestamp()

      }
    );


    hasChanges =
      false;


    if (currentSurvey) {

      currentSurvey.questions =
        questions;

      currentSurvey.questionsCount =
        questions.length;

    }


    saveStatus.textContent =
      "تم حفظ جميع التغييرات ✅";


    showToast(
      "تم حفظ الأسئلة بنجاح ✅"
    );

  }

  catch (error) {

    console.error(
      "Save questions error:",
      error
    );


    saveStatus.textContent =
      "حدث خطأ أثناء الحفظ";


    showToast(
      "تعذر حفظ الأسئلة"
    );

  }

  finally {

    saveQuestionsBtn.disabled =
      false;


    saveQuestionsBtn.textContent =
      "حفظ الأسئلة";

  }

}


// ======================================================
// معاينة الاستبانة
// ======================================================

previewBtn.addEventListener(
  "click",
  () => {

    if (!currentSurvey) {

      showToast(
        "انتظر حتى يتم تحميل الاستبانة"
      );

      return;

    }


    if (
      !currentSurvey.slug
    ) {

      showToast(
        "لا يوجد رابط لهذه الاستبانة"
      );

      return;

    }


    const previewUrl =
      new URL(
        "survey.html",
        window.location.href
      );


    previewUrl.searchParams.set(
      "s",
      currentSurvey.slug
    );


    window.open(
      previewUrl.href,
      "_blank"
    );

  }
);


// ======================================================
// تسجيل وجود تغييرات
// ======================================================

function markChanged() {

  hasChanges =
    true;


  saveStatus.textContent =
    "لديك تغييرات غير محفوظة";

}


// ======================================================
// تحذير قبل إغلاق الصفحة
// ======================================================

window.addEventListener(
  "beforeunload",
  event => {

    if (!hasChanges) {
      return;
    }


    event.preventDefault();


    event.returnValue =
      "";

  }
);


// ======================================================
// تعطيل المحرر
// ======================================================

function disableBuilder() {

  document
    .querySelectorAll(
      "[data-question-type]"
    )
    .forEach(
      button => {

        button.disabled =
          true;

      }
    );


  saveQuestionsBtn.disabled =
    true;


  previewBtn.disabled =
    true;

}


// ======================================================
// إنشاء ID فريد للسؤال
// ======================================================

function generateId() {

  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {

    return crypto.randomUUID();

  }


  return (
    "question-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 10)
  );

}


// ======================================================
// حماية النص من HTML
// ======================================================

function escapeHtml(text) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    text || "";


  return div.innerHTML;

}


// ======================================================
// حماية النص داخل value
// ======================================================

function escapeAttribute(text) {

  return String(
    text || ""
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
// التنبيهات
// ======================================================

function showToast(message) {

  if (!toast) {

    console.log(
      message
    );

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
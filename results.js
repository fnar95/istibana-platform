// ======================================================
// results.js
// لوحة النتائج المباشرة + تصدير Excel
// ======================================================

import {

  db,

  collection,
  doc,
  onSnapshot,

  auth,
  onAuthStateChanged

} from "./firebase-config.js";


// ======================================================
// عناصر الصفحة
// ======================================================

const authGuard =
  document.getElementById(
    "authGuard"
  );


const surveyTitle =
  document.getElementById(
    "surveyTitle"
  );


const surveyDescription =
  document.getElementById(
    "surveyDescription"
  );


const totalResponses =
  document.getElementById(
    "totalResponses"
  );


const totalQuestions =
  document.getElementById(
    "totalQuestions"
  );


const completionRate =
  document.getElementById(
    "completionRate"
  );


const totalAnswers =
  document.getElementById(
    "totalAnswers"
  );


const responsesBadge =
  document.getElementById(
    "responsesBadge"
  );


const resultsContainer =
  document.getElementById(
    "resultsContainer"
  );


const openSurveyBtn =
  document.getElementById(
    "openSurveyBtn"
  );


const exportExcelBtn =
  document.getElementById(
    "exportExcelBtn"
  );


const summaryMessage =
  document.getElementById(
    "summaryMessage"
  );


const lastUpdate =
  document.getElementById(
    "lastUpdate"
  );


const responsesStatCard =
  document.getElementById(
    "responsesStatCard"
  );


const toast =
  document.getElementById(
    "toast"
  );


// ======================================================
// ID الاستبانة
// ======================================================

const params =
  new URLSearchParams(
    window.location.search
  );


const surveyId =
  params.get("id");


// ======================================================
// البيانات
// ======================================================

let currentSurvey =
  null;


let questions =
  [];


let responses =
  [];


let unsubscribeSurvey =
  null;


let unsubscribeResponses =
  null;


let previousResponseCount =
  0;


let firstRealtimeLoad =
  true;


let listenersStarted =
  false;


// ======================================================
// حماية الصفحة
// ======================================================

onAuthStateChanged(

  auth,

  user => {

    if (!user) {

      window.location.replace(
        "index.html"
      );

      return;

    }


    if (!surveyId) {

      showError(
        "لم يتم تحديد الاستبانة المطلوبة."
      );


      authGuard.classList.add(
        "hidden"
      );

      return;

    }


    authGuard.classList.add(
      "hidden"
    );


    if (
      !listenersStarted
    ) {

      listenersStarted =
        true;


      startRealtime();

    }

  },

  error => {

    console.error(
      "Auth error:",
      error
    );


    window.location.replace(
      "index.html"
    );

  }

);


// ======================================================
// بدء النتائج الحية
// ======================================================

function startRealtime() {

  startSurveyListener();

  startResponsesListener();

}


// ======================================================
// متابعة الاستبانة
// ======================================================

function startSurveyListener() {

  const surveyRef =
    doc(
      db,
      "surveys",
      surveyId
    );


  unsubscribeSurvey =
    onSnapshot(

      surveyRef,

      snapshot => {

        if (
          !snapshot.exists()
        ) {

          showError(
            "الاستبانة غير موجودة أو تم حذفها."
          );

          return;

        }


        currentSurvey = {

          id:
            snapshot.id,

          ...snapshot.data()

        };


        questions =
          Array.isArray(
            currentSurvey.questions
          )
            ?
            currentSurvey.questions
            :
            [];


        updateSurveyInfo();


        updateDashboard();


        renderResults();

      },

      error => {

        console.error(
          "Survey listener error:",
          error
        );


        showError(
          "تعذر قراءة بيانات الاستبانة."
        );

      }

    );

}


// ======================================================
// متابعة الردود
// ======================================================

function startResponsesListener() {

  const responsesRef =
    collection(
      db,
      "surveys",
      surveyId,
      "responses"
    );


  unsubscribeResponses =
    onSnapshot(

      responsesRef,

      snapshot => {

        previousResponseCount =
          responses.length;


        responses =
          [];


        snapshot.forEach(
          responseDoc => {

            responses.push({

              id:
                responseDoc.id,

              ...responseDoc.data()

            });

          }
        );


        sortResponsesByDate();


        updateDashboard();


        renderResults();


        updateLastUpdate();


        // ======================================
        // اكتشاف مشاركة جديدة
        // ======================================

        if (
          !firstRealtimeLoad &&
          responses.length >
          previousResponseCount
        ) {

          const difference =
            responses.length -
            previousResponseCount;


          showNewResponseEffect();


          if (
            difference === 1
          ) {

            showToast(
              "✨ وصلت مشاركة جديدة"
            );

          }

          else {

            showToast(
              `✨ وصلت ${difference} مشاركات جديدة`
            );

          }

        }


        firstRealtimeLoad =
          false;

      },

      error => {

        console.error(
          "Responses listener error:",
          error
        );


        if (
          error?.code ===
          "permission-denied"
        ) {

          showError(
            "ليس لديك صلاحية لقراءة نتائج هذه الاستبانة."
          );

          return;

        }


        showError(
          "تعذر متابعة المشاركات."
        );

      }

    );

}


// ======================================================
// معلومات الاستبانة
// ======================================================

function updateSurveyInfo() {

  if (
    !currentSurvey
  ) {

    return;

  }


  surveyTitle.textContent =
    currentSurvey.title ||
    "استبانة";


  surveyDescription.textContent =
    currentSurvey.description ||
    "بدون وصف";


  document.title =
    `${
      currentSurvey.title ||
      "الاستبانة"
    } | النتائج`;

}


// ======================================================
// تحديث الإحصاءات
// ======================================================

function updateDashboard() {

  const responseCount =
    responses.length;


  const questionCount =
    questions.length;


  totalResponses.textContent =
    responseCount;


  totalQuestions.textContent =
    questionCount;


  responsesBadge.textContent =
    responsesLabel(
      responseCount
    );


  // ======================================
  // إجمالي الإجابات
  // ======================================

  let actualAnswers =
    0;


  responses.forEach(
    response => {

      const answers =
        Array.isArray(
          response.answers
        )
          ?
          response.answers
          :
          [];


      answers.forEach(
        answer => {

          if (
            isAnswered(
              answer.value
            )
          ) {

            actualAnswers++;

          }

        }
      );

    }
  );


  totalAnswers.textContent =
    actualAnswers;


  // ======================================
  // نسبة الإكمال
  // ======================================

  const possibleAnswers =
    responseCount *
    questionCount;


  const rate =
    possibleAnswers > 0

      ?

      Math.round(
        (
          actualAnswers /
          possibleAnswers
        ) *
        100
      )

      :

      0;


  completionRate.textContent =
    `${rate}%`;


  // ======================================
  // الملخص
  // ======================================

  if (
    responseCount === 0
  ) {

    summaryMessage.textContent =
      "بانتظار أول مشاركة في الاستبانة.";

  }

  else if (
    rate === 100
  ) {

    summaryMessage.textContent =
      "جميع المشاركات الحالية مكتملة بنسبة 100%.";

  }

  else {

    summaryMessage.textContent =
      `تم استلام ${responseCount} مشاركة ونسبة الإكمال الحالية ${rate}%.`;

  }

}


// ======================================================
// عرض النتائج
// ======================================================

function renderResults() {

  if (
    questions.length === 0
  ) {

    resultsContainer.innerHTML = `

      <div class="state-card">

        <div class="state-icon">
          📭
        </div>

        <h3>
          لا توجد أسئلة
        </h3>

        <p>
          لم تتم إضافة أسئلة إلى هذه الاستبانة.
        </p>

      </div>

    `;

    return;

  }


  resultsContainer.innerHTML =
    "";


  questions.forEach(
    (
      question,
      index
    ) => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "result-question";


      card.innerHTML =
        buildQuestionResult(
          question,
          index
        );


      resultsContainer
        .appendChild(
          card
        );

    }
  );


  animateBars();

}


// ======================================================
// بطاقة السؤال
// ======================================================

function buildQuestionResult(
  question,
  index
) {

  const values =
    getQuestionResponses(
      question
    );


  const answeredCount =
    values.filter(
      value =>
        isAnswered(
          value
        )
    ).length;


  const requiredHtml =
    question.required

      ?

      `
        <span class="question-required">
          مطلوب
        </span>
      `

      :

      "";


  return `

    <div class="question-header">


      <div class="question-title-wrap">


        <div class="question-number">
          ${index + 1}
        </div>


        <div>


          <h3>

            ${escapeHtml(
              question.text ||
              "سؤال بدون عنوان"
            )}

          </h3>


          <div class="question-meta">


            <span class="question-type">

              ${getQuestionTypeLabel(
                question.type
              )}

            </span>


            ${requiredHtml}


          </div>


        </div>


      </div>


      <span class="question-responses">

        ${answeredCount}
        إجابة

      </span>


    </div>


    ${buildQuestionBody(
      question,
      values
    )}

  `;

}


// ======================================================
// محتوى السؤال
// ======================================================

function buildQuestionBody(
  question,
  values
) {

  switch (
    question.type
  ) {

    case "radio":

    case "yes-no":

      return buildChoiceResults(
        question,
        values
      );


    case "checkbox":

      return buildCheckboxResults(
        question,
        values
      );


    case "rating":

      return buildRatingResults(
        question,
        values
      );


    case "short-text":

    case "long-text":

      return buildTextResults(
        values
      );


    default:

      return buildTextResults(
        values
      );

  }

}


// ======================================================
// نتائج الاختيار الواحد
// ======================================================

function buildChoiceResults(
  question,
  values
) {

  const options =
    getOptions(
      question
    );


  const validValues =
    values.filter(
      value =>
        isAnswered(
          value
        )
    );


  const total =
    validValues.length;


  if (
    total === 0
  ) {

    return noResultsHtml();

  }


  return options
    .map(
      option => {

        const count =
          validValues.filter(
            value =>
              String(value) ===
              String(option)
          ).length;


        const percent =
          Math.round(
            (
              count /
              total
            ) *
            100
          );


        return optionHtml(
          option,
          count,
          percent
        );

      }
    )
    .join("");

}


// ======================================================
// نتائج الاختيار المتعدد
// ======================================================

function buildCheckboxResults(
  question,
  values
) {

  const options =
    getOptions(
      question
    );


  const validResponses =
    values.filter(
      value =>
        Array.isArray(value) &&
        value.length > 0
    );


  const totalRespondents =
    validResponses.length;


  if (
    totalRespondents === 0
  ) {

    return noResultsHtml();

  }


  return options
    .map(
      option => {

        let count =
          0;


        validResponses.forEach(
          selectedOptions => {

            const selected =
              selectedOptions.some(
                item =>
                  String(item) ===
                  String(option)
              );


            if (selected) {

              count++;

            }

          }
        );


        const percent =
          Math.round(
            (
              count /
              totalRespondents
            ) *
            100
          );


        return optionHtml(
          option,
          count,
          percent
        );

      }
    )
    .join("");

}


// ======================================================
// نتائج التقييم
// ======================================================

function buildRatingResults(
  question,
  values
) {

  const validValues =
    values

      .filter(
        value =>
          isAnswered(
            value
          )
      )

      .map(
        value =>
          Number(value)
      )

      .filter(
        value =>
          Number.isFinite(
            value
          )
      );


  if (
    validValues.length === 0
  ) {

    return noResultsHtml();

  }


  const sum =
    validValues.reduce(
      (
        total,
        value
      ) =>
        total + value,
      0
    );


  const average =
    sum /
    validValues.length;


  const numericOptions =
    getOptions(
      question
    )

      .map(
        Number
      )

      .filter(
        value =>
          Number.isFinite(
            value
          )
      );


  const maxRating =
    numericOptions.length > 0

      ?

      Math.max(
        ...numericOptions
      )

      :

      5;


  const distributionHtml =
    buildChoiceResults(
      question,
      values
    );


  return `

    <div class="rating-summary">


      <div class="average-rating">

        <strong>
          ${average.toFixed(1)}
        </strong>

        <span>
          متوسط التقييم من ${maxRating}
        </span>

        <div class="rating-stars">
          ⭐
        </div>

      </div>


      <div class="rating-description">

        تم احتساب المتوسط من

        <strong>
          ${validValues.length}
        </strong>

        تقييم.

        كلما اقترب المتوسط من
        ${maxRating}
        كان التقييم أعلى.

      </div>


    </div>


    ${distributionHtml}

  `;

}


// ======================================================
// HTML للخيار
// ======================================================

function optionHtml(
  option,
  count,
  percent
) {

  return `

    <div class="option-result">


      <div class="option-info">


        <div class="option-label-wrap">

          <span class="option-dot"></span>

          <span class="option-label">

            ${escapeHtml(
              option
            )}

          </span>

        </div>


        <div class="option-stats">


          <span class="option-count">

            ${count}

            ${
              count === 1
                ?
                "اختيار"
                :
                "اختيارات"
            }

          </span>


          <span class="option-percent">

            ${percent}%

          </span>


        </div>


      </div>


      <div class="result-bar">

        <div
          class="result-bar-fill"
          data-width="${percent}"
        ></div>

      </div>


    </div>

  `;

}


// ======================================================
// الإجابات النصية
// ======================================================

function buildTextResults(
  values
) {

  const texts =
    values

      .filter(
        value =>
          isAnswered(
            value
          )
      )

      .map(
        value =>
          String(value)
            .trim()
      );


  if (
    texts.length === 0
  ) {

    return noResultsHtml();

  }


  return `

    <div class="text-toolbar">

      <span>

        💬 ${texts.length}
        إجابة نصية

      </span>

    </div>


    <div class="text-responses">


      ${texts
        .map(
          (
            text,
            index
          ) => `

            <div class="text-response">

              <span
                class="text-response-number"
              >
                ${index + 1}
              </span>

              ${escapeHtml(
                text
              )}

            </div>

          `
        )
        .join("")}


    </div>

  `;

}


// ======================================================
// لا توجد نتائج
// ======================================================

function noResultsHtml() {

  return `

    <div class="no-results">

      📭 لا توجد إجابات
      على هذا السؤال حتى الآن.

    </div>

  `;

}


// ======================================================
// استخراج إجابات السؤال
// ======================================================

function getQuestionResponses(
  question
) {

  const values =
    [];


  responses.forEach(
    response => {

      const answers =
        Array.isArray(
          response.answers
        )
          ?
          response.answers
          :
          [];


      const answer =
        answers.find(
          item =>
            item.questionId ===
            question.id
        );


      if (answer) {

        values.push(
          answer.value
        );

      }

    }
  );


  return values;

}


// ======================================================
// خيارات السؤال
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
    "yes-no"
  ) {

    return [
      "نعم",
      "لا"
    ];

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
// هل الإجابة موجودة؟
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
// اسم نوع السؤال
// ======================================================

function getQuestionTypeLabel(
  type
) {

  switch (type) {

    case "radio":

      return "اختيار واحد";


    case "checkbox":

      return "اختيار متعدد";


    case "short-text":

      return "إجابة قصيرة";


    case "long-text":

      return "إجابة طويلة";


    case "yes-no":

      return "نعم / لا";


    case "rating":

      return "مقياس تقييم";


    default:

      return "سؤال";

  }

}


// ======================================================
// صياغة المشاركات
// ======================================================

function responsesLabel(
  count
) {

  if (
    count === 0
  ) {

    return "0 مشاركة";

  }


  if (
    count === 1
  ) {

    return "مشاركة واحدة";

  }


  if (
    count === 2
  ) {

    return "مشاركتان";

  }


  if (
    count >= 3 &&
    count <= 10
  ) {

    return `${count} مشاركات`;

  }


  return `${count} مشاركة`;

}


// ======================================================
// تحريك الأشرطة
// ======================================================

function animateBars() {

  requestAnimationFrame(
    () => {

      document
        .querySelectorAll(
          ".result-bar-fill"
        )
        .forEach(
          bar => {

            const width =
              Math.max(
                0,
                Math.min(
                  100,
                  Number(
                    bar.dataset.width ||
                    0
                  )
                )
              );


            bar.style.width =
              "0%";


            requestAnimationFrame(
              () => {

                setTimeout(
                  () => {

                    bar.style.width =
                      `${width}%`;

                  },
                  40
                );

              }
            );

          }
        );

    }
  );

}


// ======================================================
// تأثير مشاركة جديدة
// ======================================================

function showNewResponseEffect() {

  responsesStatCard
    .classList
    .remove(
      "new-response-flash"
    );


  void responsesStatCard.offsetWidth;


  responsesStatCard
    .classList
    .add(
      "new-response-flash"
    );

}


// ======================================================
// آخر تحديث
// ======================================================

function updateLastUpdate() {

  const now =
    new Date();


  const formatted =
    new Intl.DateTimeFormat(
      "ar-SA",
      {

        hour:
          "numeric",

        minute:
          "2-digit",

        second:
          "2-digit"

      }
    )
    .format(
      now
    );


  lastUpdate.textContent =
    `آخر تحديث: ${formatted}`;

}


// ======================================================
// ترتيب المشاركات
// ======================================================

function sortResponsesByDate() {

  responses.sort(
    (
      a,
      b
    ) => {

      return (
        timestampValue(
          b.submittedAt
        ) -
        timestampValue(
          a.submittedAt
        )
      );

    }
  );

}


// ======================================================
// Timestamp
// ======================================================

function timestampValue(
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
// فتح الاستبانة
// ======================================================

openSurveyBtn
  .addEventListener(
    "click",
    () => {

      if (
        !currentSurvey ||
        !currentSurvey.slug
      ) {

        showToast(
          "تعذر تحديد رابط الاستبانة"
        );

        return;

      }


      const url =
        new URL(
          "survey.html",
          window.location.href
        );


      url.searchParams.set(
        "s",
        currentSurvey.slug
      );


      window.open(
        url.href,
        "_blank"
      );

    }
  );


// ======================================================
// تصدير Excel
// ======================================================

exportExcelBtn
  .addEventListener(
    "click",
    exportResultsToExcel
  );


function exportResultsToExcel() {

  // ======================================
  // التحقق من المكتبة
  // ======================================

  if (
    typeof XLSX ===
    "undefined"
  ) {

    showToast(
      "تعذر تحميل مكتبة Excel"
    );

    return;

  }


  // ======================================
  // التحقق من الاستبانة
  // ======================================

  if (
    !currentSurvey
  ) {

    showToast(
      "لم يتم تحميل بيانات الاستبانة بعد"
    );

    return;

  }


  // ======================================
  // لا توجد مشاركات
  // ======================================

  if (
    responses.length === 0
  ) {

    showToast(
      "لا توجد مشاركات لتصديرها"
    );

    return;

  }


  try {

    exportExcelBtn.disabled =
      true;


    exportExcelBtn.textContent =
      "⏳ جاري إنشاء Excel";


    // ======================================
    // Workbook
    // ======================================

    const workbook =
      XLSX.utils.book_new();


    // ==================================================
    // الورقة الأولى:
    // معلومات الاستبانة
    // ==================================================

    const surveyInfoRows = [

      {
        "البيان":
          "عنوان الاستبانة",

        "القيمة":
          currentSurvey.title ||
          ""
      },

      {
        "البيان":
          "وصف الاستبانة",

        "القيمة":
          currentSurvey.description ||
          ""
      },

      {
        "البيان":
          "عدد المشاركين",

        "القيمة":
          responses.length
      },

      {
        "البيان":
          "عدد الأسئلة",

        "القيمة":
          questions.length
      },

      {
        "البيان":
          "تاريخ التصدير",

        "القيمة":
          formatDate(
            new Date()
          )
      }

    ];


    const surveyInfoSheet =
      XLSX.utils.json_to_sheet(
        surveyInfoRows
      );


    surveyInfoSheet["!cols"] = [

      {
        wch: 25
      },

      {
        wch: 60
      }

    ];


    surveyInfoSheet["!view"] = {

      RTL: true

    };


    XLSX.utils.book_append_sheet(

      workbook,

      surveyInfoSheet,

      "بيانات الاستبانة"

    );


    // ==================================================
    // الورقة الثانية:
    // الردود التفصيلية
    // ==================================================

    const detailedRows =
      [];


    responses.forEach(
      (
        response,
        responseIndex
      ) => {

        const row = {

          "رقم المشاركة":
            responseIndex + 1,

          "تاريخ الإرسال":
            formatSubmittedAt(
              response.submittedAt
            )

        };


        const answers =
          Array.isArray(
            response.answers
          )
            ?
            response.answers
            :
            [];


        questions.forEach(
          (
            question,
            questionIndex
          ) => {

            const answer =
              answers.find(
                item =>
                  item.questionId ===
                  question.id
              );


            let value =
              "";


            if (
              answer
            ) {

              if (
                Array.isArray(
                  answer.value
                )
              ) {

                value =
                  answer.value.join(
                    "، "
                  );

              }

              else {

                value =
                  answer.value ??
                  "";

              }

            }


            const columnName =
              `${questionIndex + 1}. ${
                question.text ||
                "سؤال"
              }`;


            row[
              columnName
            ] =
              value;

          }
        );


        detailedRows.push(
          row
        );

      }
    );


    const responsesSheet =
      XLSX.utils.json_to_sheet(
        detailedRows
      );


    autoSizeColumns(

      responsesSheet,

      detailedRows

    );


    responsesSheet["!view"] = {

      RTL: true

    };


    XLSX.utils.book_append_sheet(

      workbook,

      responsesSheet,

      "الردود"

    );


    // ==================================================
    // الورقة الثالثة:
    // ملخص النتائج
    // ==================================================

    const summaryRows =
      [];


    questions.forEach(
      (
        question,
        questionIndex
      ) => {

        const values =
          getQuestionResponses(
            question
          );


        const answered =
          values.filter(
            value =>
              isAnswered(
                value
              )
          );


        // ======================================
        // اختيار واحد / نعم لا
        // ======================================

        if (
          question.type ===
            "radio" ||
          question.type ===
            "yes-no"
        ) {

          const options =
            getOptions(
              question
            );


          options.forEach(
            option => {

              const count =
                answered.filter(
                  value =>
                    String(value) ===
                    String(option)
                ).length;


              const percent =
                answered.length > 0

                  ?

                  Math.round(
                    (
                      count /
                      answered.length
                    ) *
                    100
                  )

                  :

                  0;


              summaryRows.push({

                "رقم السؤال":
                  questionIndex + 1,

                "السؤال":
                  question.text ||
                  "",

                "نوع السؤال":
                  getQuestionTypeLabel(
                    question.type
                  ),

                "الخيار / البيان":
                  option,

                "عدد الإجابات":
                  count,

                "النسبة المئوية":
                  `${percent}%`

              });

            }
          );

        }


        // ======================================
        // اختيار متعدد
        // ======================================

        else if (
          question.type ===
          "checkbox"
        ) {

          const options =
            getOptions(
              question
            );


          const validResponses =
            answered.filter(
              value =>
                Array.isArray(
                  value
                )
            );


          options.forEach(
            option => {

              let count =
                0;


              validResponses.forEach(
                selectedOptions => {

                  if (
                    selectedOptions.some(
                      selected =>
                        String(selected) ===
                        String(option)
                    )
                  ) {

                    count++;

                  }

                }
              );


              const percent =
                validResponses.length > 0

                  ?

                  Math.round(
                    (
                      count /
                      validResponses.length
                    ) *
                    100
                  )

                  :

                  0;


              summaryRows.push({

                "رقم السؤال":
                  questionIndex + 1,

                "السؤال":
                  question.text ||
                  "",

                "نوع السؤال":
                  getQuestionTypeLabel(
                    question.type
                  ),

                "الخيار / البيان":
                  option,

                "عدد الإجابات":
                  count,

                "النسبة المئوية":
                  `${percent}%`

              });

            }
          );

        }


        // ======================================
        // التقييم
        // ======================================

        else if (
          question.type ===
          "rating"
        ) {

          const numbers =
            answered

              .map(
                value =>
                  Number(value)
              )

              .filter(
                value =>
                  Number.isFinite(
                    value
                  )
              );


          const average =
            numbers.length > 0

              ?

              (
                numbers.reduce(
                  (
                    sum,
                    value
                  ) =>
                    sum + value,
                  0
                ) /
                numbers.length
              ).toFixed(2)

              :

              "0";


          summaryRows.push({

            "رقم السؤال":
              questionIndex + 1,

            "السؤال":
              question.text ||
              "",

            "نوع السؤال":
              "مقياس تقييم",

            "الخيار / البيان":
              "متوسط التقييم",

            "عدد الإجابات":
              numbers.length,

            "النسبة المئوية":
              average

          });


          // إضافة توزيع التقييم

          const options =
            getOptions(
              question
            );


          options.forEach(
            option => {

              const count =
                numbers.filter(
                  value =>
                    String(value) ===
                    String(option)
                ).length;


              const percent =
                numbers.length > 0

                  ?

                  Math.round(
                    (
                      count /
                      numbers.length
                    ) *
                    100
                  )

                  :

                  0;


              summaryRows.push({

                "رقم السؤال":
                  questionIndex + 1,

                "السؤال":
                  question.text ||
                  "",

                "نوع السؤال":
                  "مقياس تقييم",

                "الخيار / البيان":
                  `التقييم ${option}`,

                "عدد الإجابات":
                  count,

                "النسبة المئوية":
                  `${percent}%`

              });

            }
          );

        }


        // ======================================
        // نصي
        // ======================================

        else {

          summaryRows.push({

            "رقم السؤال":
              questionIndex + 1,

            "السؤال":
              question.text ||
              "",

            "نوع السؤال":
              getQuestionTypeLabel(
                question.type
              ),

            "الخيار / البيان":
              "إجابات نصية",

            "عدد الإجابات":
              answered.length,

            "النسبة المئوية":
              ""

          });

        }

      }
    );


    const summarySheet =
      XLSX.utils.json_to_sheet(
        summaryRows
      );


    autoSizeColumns(

      summarySheet,

      summaryRows

    );


    summarySheet["!view"] = {

      RTL: true

    };


    XLSX.utils.book_append_sheet(

      workbook,

      summarySheet,

      "ملخص النتائج"

    );


    // ==================================================
    // الورقة الرابعة:
    // الإجابات النصية
    // ==================================================

    const textRows =
      [];


    questions.forEach(
      (
        question,
        questionIndex
      ) => {

        if (
          question.type !==
            "short-text" &&
          question.type !==
            "long-text"
        ) {

          return;

        }


        const values =
          getQuestionResponses(
            question
          )


          .filter(
            value =>
              isAnswered(
                value
              )
          );


        values.forEach(
          (
            value,
            answerIndex
          ) => {

            textRows.push({

              "رقم السؤال":
                questionIndex + 1,

              "السؤال":
                question.text ||
                "",

              "رقم الإجابة":
                answerIndex + 1,

              "الإجابة":
                String(value)

            });

          }
        );

      }
    );


    if (
      textRows.length > 0
    ) {

      const textSheet =
        XLSX.utils.json_to_sheet(
          textRows
        );


      textSheet["!cols"] = [

        {
          wch: 12
        },

        {
          wch: 45
        },

        {
          wch: 12
        },

        {
          wch: 70
        }

      ];


      textSheet["!view"] = {

        RTL: true

      };


      XLSX.utils.book_append_sheet(

        workbook,

        textSheet,

        "الإجابات النصية"

      );

    }


    // ==================================================
    // اسم الملف
    // ==================================================

    const safeTitle =
      String(
        currentSurvey.title ||
        "نتائج-الاستبانة"
      )

        .replace(
          /[\\/:*?"<>|]/g,
          "-"
        )

        .trim();


    const now =
      new Date();


    const fileDate =
      `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      )}-${String(
        now.getDate()
      ).padStart(
        2,
        "0"
      )}`;


    const fileName =
      `${safeTitle}-${fileDate}.xlsx`;


    // ==================================================
    // إنشاء الملف
    // ==================================================

    XLSX.writeFile(

      workbook,

      fileName

    );


    showToast(
      "تم تصدير النتائج إلى Excel بنجاح ✅"
    );

  }

  catch (error) {

    console.error(
      "Excel export error:",
      error
    );


    showToast(
      "تعذر تصدير ملف Excel"
    );

  }

  finally {

    exportExcelBtn.disabled =
      false;


    exportExcelBtn.textContent =
      "📥 تصدير Excel";

  }

}


// ======================================================
// تنسيق تاريخ المشاركة
// ======================================================

function formatSubmittedAt(
  timestamp
) {

  if (!timestamp) {

    return "";

  }


  try {

    let date;


    if (
      typeof timestamp.toDate ===
      "function"
    ) {

      date =
        timestamp.toDate();

    }

    else if (
      typeof timestamp.seconds ===
      "number"
    ) {

      date =
        new Date(
          timestamp.seconds *
          1000
        );

    }

    else {

      return "";

    }


    return formatDate(
      date
    );

  }

  catch {

    return "";

  }

}


// ======================================================
// تنسيق التاريخ
// ======================================================

function formatDate(
  date
) {

  try {

    return new Intl.DateTimeFormat(
      "ar-SA",
      {

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit"

      }
    )
    .format(
      date
    );

  }

  catch {

    return "";

  }

}


// ======================================================
// ضبط عرض الأعمدة
// ======================================================

function autoSizeColumns(
  sheet,
  rows
) {

  if (
    !rows ||
    rows.length === 0
  ) {

    return;

  }


  const keys =
    Object.keys(
      rows[0]
    );


  sheet["!cols"] =
    keys.map(
      key => {

        let maxLength =
          String(key).length;


        rows.forEach(
          row => {

            const value =
              row[key] ??
              "";


            const length =
              String(value)
                .length;


            if (
              length >
              maxLength
            ) {

              maxLength =
                length;

            }

          }
        );


        return {

          wch:
            Math.min(

              Math.max(
                maxLength + 3,
                12
              ),

              55

            )

        };

      }
    );

}


// ======================================================
// الخطأ
// ======================================================

function showError(
  message
) {

  resultsContainer.innerHTML = `

    <div class="state-card">

      <div class="state-icon">
        ⚠️
      </div>

      <h3>
        تعذر عرض النتائج
      </h3>

      <p>

        ${escapeHtml(
          message
        )}

      </p>

    </div>

  `;


  showToast(
    message
  );

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
// حماية النصوص
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
// تنظيف Realtime Listeners
// ======================================================

window.addEventListener(
  "beforeunload",
  () => {

    if (
      typeof unsubscribeSurvey ===
      "function"
    ) {

      unsubscribeSurvey();

    }


    if (
      typeof unsubscribeResponses ===
      "function"
    ) {

      unsubscribeResponses();

    }

  }
);
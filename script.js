



// قائمة كلمات شائعة بالإنجليزي 
const stopWords = new Set([
    "the", "and", "is", "in", "at", "of", "a", "an", "to", "for", "on", "with", "that", "this", "it", "as", "by", "from"
  ]);
  
  // دالة تصريف بسيطة: تحذف النهايات الشائعة مثل ing, ed, s
  function simpleStem(word) {
    return word.replace(/(ing|ed|s)$/i, '');
  }
  
  // دالة تحضير النص: تفكيك + إزالة كلمات شائعة + تصريف(tokenization)
  function preprocessText(text) {
    let words = text.toLowerCase().match(/\b\w+\b/g) || [];
    words = words.filter(word => !stopWords.has(word));
    words = words.map(simpleStem);
    return words;
  }
  

// دالة لتحديد الكلمات في النص باللون الأصفر

function highlightSearchTerms(text, terms) {
    let highlightedText = text;
  
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
    });
  
    return highlightedText;
  }

  
  
//دالة بناء المفردات (vocabulary) for cosine semilarity 1
function buildVocabulary(data) {
  const vocabSet = new Set();
  data.forEach(item => {
    const words = preprocessText(`${item.title} ${item.description}`);
    words.forEach(word => vocabSet.add(word));
  });
  return Array.from(vocabSet);
}
 // دالة تحويل النص لشعاع (vectorize)  for cosine semilarity 2
 function vectorize(text, vocabulary) {
  const vector = new Array(vocabulary.length).fill(0);
  const words = preprocessText(text);

  words.forEach(word => {
    const index = vocabulary.indexOf(word);
    if (index !== -1) {
      vector[index]++;
    }
  });

  return vector;
}
// دالة حساب تشابه كوزاين (cosineSimilarity)
function cosineSimilarity(vec1, vec2) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitudeA += vec1[i] ** 2;
    magnitudeB += vec2[i] ** 2;
  }

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

//search with cosine semilarity in consol
// searchWithCosineSimilarity("your search query here");

function searchWithCosineSimilarity(query) {
  if (!vocabulary || vocabulary.length === 0) {
    console.log("Vocabulary is empty. Cannot perform cosine similarity search.");
    return;
  }

  const queryVector = vectorize(query, vocabulary);
  
  const scores = allData.map(item => {
    const text = `${item.title} ${item.description}`;
    const docVector = vectorize(text, vocabulary);
    const score = cosineSimilarity(queryVector, docVector);
    return { id: item.id, score, title: item.title };
  });

  scores.sort((a, b) => b.score - a.score);

  console.log(`Results for query "${query}" using Cosine Similarity:`);
  scores.forEach(result => {
    console.log(`Doc ID: ${result.id}, Score: ${result.score.toFixed(4)}, Title: ${result.title}`);
  });
}

 
//داخل الـ DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      allData = data;
      buildInvertedIndex(data);
      buildDocumentTermMatrix(data);
      vocabulary = buildVocabulary(data);  // هنا تبني قائمة المفردات
      displayData(data);
    })
    .catch(error => console.error('Error loading data:', error));
});


  // دالة لعرض البيانات
  function displayData(items, terms = []) {
    const content = document.getElementById('content');
    content.innerHTML = '';
  
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
  
      // تمييز النصوص التي تحتوي على الكلمات التي يبحث عنها المستخدم
      const highlightedTitle = highlightSearchTerms(item.title, terms);
      const highlightedDescription = highlightSearchTerms(item.description, terms);
  
      card.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <h3>${highlightedTitle}</h3>
        <p>${highlightedDescription}</p>
      `;
  
      content.appendChild(card);
    });
  }
  
  // دالة لتصحيح الكلمة الخاطئة
  function correctSpelling(word) {
    let minDistance = Infinity;
    let correctedWord = word;
  
    for (const knownWord in invertedIndex) {
      const distance = editDistance(word, knownWord);
      if (distance < minDistance) {
        minDistance = distance;
        correctedWord = knownWord;
      }
    }
  
    // إذا تم تصحيح الكلمة، نقوم بعرض تنبيه
    if (correctedWord !== word) {
      alert(`تم تصحيح الكلمة: "${word}" إلى "${correctedWord}"`); // تنبيه بالكلمة المصححة
      document.getElementById('searchInput').value = correctedWord; // وضع الكلمة المصححة في حقل البحث
    }
  
    return correctedWord;
  }
  
  // دالة حساب المسافة بين الكلمات (Levenshtein Distance)
  function editDistance(a, b) {
    const dp = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
  
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i-1] === b[j-1]) {
          dp[i][j] = dp[i-1][j-1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
        }
      }
    }
    return dp[a.length][b.length];
  }
  

//normalization
  function normalizeWord(word) {
    const stopWords = ['the', 'is', 'in', 'of', 'and', 'a', 'to'];
    word = word.toLowerCase();
  
    if (stopWords.includes(word)) return '';
  
    // Stemming بسيط
    return word.replace(/(ing|ed|s)$/g, '');
  }
  



  // بناء الـ inverted index
  let invertedIndex = {};
  let allData = [];
  
  document.addEventListener("DOMContentLoaded", () => {
    fetch('data.json')
      .then(response => response.json())
      .then(data => {
        allData = data;           // نخزن الداتا عشان نبحث فيها
        buildInvertedIndex(data); // نبني الاندكس
        buildDocumentTermMatrix(data); //calling document loaded ← هنا

        displayData(data);        // نعرض الداتا
      })
      .catch(error => console.error('Error loading data:', error));
  });
  
  function buildInvertedIndex(data) {
    invertedIndex = {};
  
    data.forEach(item => {
        let words = preprocessText(`${item.title} ${item.description}`);
        // استخراج الكلمات بدون رموز
  
      words.forEach(word => {
        if (!invertedIndex[word]) {
          invertedIndex[word] = [];
        }
        invertedIndex[word].push(item.id); // نحط الـ id بتاع العنصر
      });
    });
  
    console.log("Inverted Index:", invertedIndex); // عشان نشوفه في الكونسول
  }
  
//دالة بناء Document-Term Incidence Matrix
let docTermMatrix = {};

function buildDocumentTermMatrix(data) {
  docTermMatrix = {};

  data.forEach(item => {
    const docId = item.id;
    const text = `${item.title} ${item.description}`.toLowerCase();

    const words = text.match(/\b\w+\b/g)
      .map(word => normalizeWord(word))
      .filter(w => w); // نحذف الفارغة

    words.forEach(word => {
      if (!docTermMatrix[word]) {
        docTermMatrix[word] = {};
      }
      docTermMatrix[word][docId] = 1;
    });
  });

  console.log("Document-Term Incidence Matrix:", docTermMatrix);
}

// searchWithDocumentTermMatrix 
function searchWithDocumentTermMatrix(query) {
    const normalized = normalizeWord(query);
    const result = docTermMatrix[normalized];
  
    if (!result) {
      console.log(`No documents found for "${query}"`);
      return [];
    }
  
    const docIds = Object.keys(result).map(id => parseInt(id));
    console.log(`Results for "${query}":`, docIds);
    return allData.filter(item => docIds.includes(item.id));
  }
  


  // دالة البحث
  document.getElementById('searchButton').addEventListener('click', () => {
    let query = document.getElementById('searchInput').value.toLowerCase();
  
    if (!query.trim()) {
      displayData(allData);
      return;
    }
  
    const rawTerms = query.match(/\b(not|and|or|\w+)\b/g) || [];
    const terms = rawTerms.map(term => {
      if (["not", "and", "or"].includes(term.toLowerCase())) {
        return term.toLowerCase();
      }
      return simpleStem(term.toLowerCase());
    }).filter(term => !stopWords.has(term) || ["not", "and", "or"].includes(term));//search with logic gates
    
  
    if (!terms) {
      displayData([]);
      return;
    }
  
    let resultSet = new Set();
    let mode = "OR"; // الوضع الافتراضي OR
    let notSet = new Set(); // لتخزين النتائج التي تحتوي على الـ NOT
  
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
  
      if (term === "and" || term === "or" || term === "not") {
        mode = term.toUpperCase();
        continue;
      }
  
      let correctedTerm = term;
      if (!invertedIndex[term]) {
        correctedTerm = correctSpelling(term); // نصحح الكلمة إذا كانت غير موجودة
      }
  
      const ids = invertedIndex[correctedTerm] ? new Set(invertedIndex[correctedTerm]) : new Set();
  
      if (i === 0 || resultSet.size === 0) {
        resultSet = new Set(ids);
      } else {
        if (mode === "AND") {
          resultSet = new Set([...resultSet].filter(x => ids.has(x)));
        } else if (mode === "OR") {
          resultSet = new Set([...resultSet, ...ids]);
        } else if (mode === "NOT") {
          notSet = new Set([...notSet, ...ids]);
        }
      }
    }
  
    // بعد معالجة الـ NOT، نقوم بحذف النتائج التي تحتوي على الكلمة المقصودة
    resultSet = new Set([...resultSet].filter(x => !notSet.has(x)));
  
    const results = allData.filter(item => resultSet.has(item.id));
    displayData(results, terms);  // تمرير الكلمات التي يتم البحث عنها لتحديدها باللون الأصفر
  });
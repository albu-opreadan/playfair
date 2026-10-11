// Playfair cipher - Romanian (31 letters) and English (25 letters)

var romanianAlphabet = "AĂÂBCDEFGHIÎJKLMNOPQRSȘTȚUVWXYZ";
var romanianFillers = "12345"; // 31 letters + 5 = 36 cells (6x6)
var englishAlphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // no J, so 25 cells (5x5)
var latinLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
// extra letters accepted in Romanian (with both kinds of ș and ț)
var romanianLetters = "ĂăÂâÎîȘșȚțŞşŢţ";

// returns all the characters used in the matrix for the chosen language
function getAlphabet(lang) {
  if (lang == "ro") {
    return romanianAlphabet + romanianFillers;
  }
  return englishAlphabet;
}

function getSize(lang) {
  if (lang == "ro") {
    return 6;
  }
  return 5;
}

// letter added when the pair would be XX
function getExtraLetter(lang) {
  if (lang == "ro") {
    return "Z";
  }
  return "Q";
}

// checks if the text has only valid letters for the chosen language
// English: A-Z and a-z, Romanian: also Ă Â Î Ș Ț
function isValidText(text, lang) {
  var allowed = latinLetters;
  if (lang == "ro") {
    allowed = allowed + romanianLetters;
  }
  for (var i = 0; i < text.length; i++) {
    if (allowed.indexOf(text.charAt(i)) == -1) {
      return false;
    }
  }
  return true;
}

// make the text uppercase, in Romanian fix ş/ţ to ș/ț, in English replace J with I
function prepareText(text, lang) {
  text = text.toUpperCase();
  if (lang == "ro") {
    text = text.split("Ş").join("Ș");
    text = text.split("Ţ").join("Ț");
  }
  if (lang == "en") {
    text = text.split("J").join("I");
  }
  return text;
}

// builds the matrix as a one dimensional array (key first, then the rest of the alphabet)
function createMatrix(key, lang) {
  var alphabet = getAlphabet(lang);
  var allChars = key + alphabet;
  var matrix = [];

  for (var i = 0; i < allChars.length; i++) {
    var ch = allChars.charAt(i);
    if (matrix.indexOf(ch) == -1 && alphabet.indexOf(ch) != -1) {
      matrix.push(ch);
    }
  }
  return matrix;
}

// draws the matrix on the page
function showMatrix(matrix, lang) {
  var size = getSize(lang);
  var gridDiv = document.getElementById("grid");
  gridDiv.style.gridTemplateColumns = "repeat(" + size + ", 1fr)";
  gridDiv.innerHTML = "";

  for (var i = 0; i < matrix.length; i++) {
    var cell = document.createElement("div");
    cell.textContent = matrix[i];
    if (lang == "ro" && romanianFillers.indexOf(matrix[i]) != -1) {
      cell.className = "filler";
    }
    gridDiv.appendChild(cell);
  }
}

// splits the message in pairs of 2 letters
function makePairs(text, lang) {
  var pairs = [];
  var i = 0;

  while (i < text.length) {
    var a = text.charAt(i);
    var b = "";
    if (i + 1 < text.length) {
      b = text.charAt(i + 1);
    }

    // the filler letter is X (or Z / Q if the letter is already X)
    var filler = "X";
    if (a == "X") {
      filler = getExtraLetter(lang);
    }

    if (b == "" || a == b) {
      // last letter alone or two equal letters
      pairs.push(a + filler);
      i = i + 1;
    } else {
      pairs.push(a + b);
      i = i + 2;
    }
  }
  return pairs;
}

// direction = 1 for encryption, -1 for decryption
function playfair(pairs, matrix, size, direction) {
  var result = "";

  for (var i = 0; i < pairs.length; i++) {
    var posA = matrix.indexOf(pairs[i].charAt(0));
    var posB = matrix.indexOf(pairs[i].charAt(1));

    var rowA = Math.floor(posA / size);
    var colA = posA % size;
    var rowB = Math.floor(posB / size);
    var colB = posB % size;

    if (rowA == rowB) {
      // same row -> move horizontally
      colA = (colA + direction + size) % size;
      colB = (colB + direction + size) % size;
    } else if (colA == colB) {
      // same column -> move vertically
      rowA = (rowA + direction + size) % size;
      rowB = (rowB + direction + size) % size;
    } else {
      // rectangle -> swap the columns
      var temp = colA;
      colA = colB;
      colB = temp;
    }

    result = result + matrix[rowA * size + colA] + matrix[rowB * size + colB];
  }
  return result;
}

// returns an error message, or "" if everything is ok
function checkInput(key, text, lang, mode) {
  var allowedRange = "litere A-Z sau a-z";
  if (lang == "ro") {
    allowedRange = "litere A-Z, a-z și Ă, Â, Î, Ș, Ț";
  }

  if (key == "") {
    return "Introdu cheia.";
  }
  if (!isValidText(key, lang)) {
    return "Cheia poate conține doar " + allowedRange + " (fără spații, cifre sau alte semne).";
  }
  if (key.length < 7) {
    return "Cheia trebuie să aibă cel puțin 7 litere.";
  }

  if (text == "") {
    if (mode == "enc") {
      return "Introdu mesajul.";
    }
    return "Introdu criptograma.";
  }

  if (mode == "enc") {
    if (!isValidText(text, lang)) {
      return "Mesajul poate conține doar " + allowedRange + " (fără spații, cifre sau alte semne).";
    }
  } else {
    // in Romanian the ciphertext can also have the digits 1-5 because they are in the matrix
    var allowed = getAlphabet(lang) + "J";
    var upper = prepareText(text, lang);
    for (var i = 0; i < upper.length; i++) {
      if (allowed.indexOf(upper.charAt(i)) == -1) {
        if (lang == "ro") {
          return "Criptograma poate conține doar literele alfabetului român (A-Z, Ă, Â, Î, Ș, Ț) și cifrele 1-5, fără spații.";
        }
        return "Criptograma poate conține doar litere A-Z sau a-z, fără spații.";
      }
    }
  }

  return "";
}

function run() {
  var lang = document.getElementById("lang").value;
  var mode = document.getElementById("mode").value;
  var key = document.getElementById("key").value.trim();
  var text = document.getElementById("input").value.trim();
  var errorP = document.getElementById("error");
  var output = document.getElementById("output");

  var error = checkInput(key, text, lang, mode);
  errorP.textContent = error;
  if (error != "") {
    output.value = "";
    return;
  }

  var size = getSize(lang);
  var matrix = createMatrix(prepareText(key, lang), lang);
  showMatrix(matrix, lang);

  text = prepareText(text, lang);

  if (mode == "enc") {
    var pairs = makePairs(text, lang);
    output.value = playfair(pairs, matrix, size, 1);
  } else {
    if (text.length % 2 != 0) {
      errorP.textContent = "Criptograma trebuie să aibă lungime pară.";
      output.value = "";
      return;
    }

    var pairs = [];
    for (var i = 0; i < text.length; i += 2) {
      var pair = text.charAt(i) + text.charAt(i + 1);
      if (pair.charAt(0) == pair.charAt(1)) {
        errorP.textContent = "Criptogramă invalidă: o pereche conține două litere identice.";
        output.value = "";
        return;
      }
      pairs.push(pair);
    }
    output.value = playfair(pairs, matrix, size, -1);
  }
}

// changes the labels and the matrix when the options change
function updateScreen() {
  var lang = document.getElementById("lang").value;
  var mode = document.getElementById("mode").value;
  var key = document.getElementById("key").value.trim();

  if (mode == "enc") {
    document.getElementById("inputLabel").textContent = "Mesaj";
    document.getElementById("run").textContent = "Criptează";
  } else {
    document.getElementById("inputLabel").textContent = "Criptogramă";
    document.getElementById("run").textContent = "Decriptează";
  }

  if (lang == "ro") {
    document.getElementById("input").placeholder = "Litere A-Z, fără spații ( cu diacritice )";
  } else {
    document.getElementById("input").placeholder = "Doar litere A-Z, fără spații";
  }

  if (isValidText(key, lang)) {
    showMatrix(createMatrix(prepareText(key, lang), lang), lang);
  } else {
    showMatrix(createMatrix("", lang), lang);
  }
}

function copyResult() {
  var value = document.getElementById("output").value;
  if (value != "") {
    navigator.clipboard.writeText(value);
  }
}

document.getElementById("run").addEventListener("click", run);
document.getElementById("copy").addEventListener("click", copyResult);
document.getElementById("lang").addEventListener("change", updateScreen);
document.getElementById("mode").addEventListener("change", updateScreen);
document.getElementById("key").addEventListener("input", updateScreen);

updateScreen();
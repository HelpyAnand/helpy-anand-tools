const password = document.getElementById("password");
const length = document.getElementById("length");
const lengthValue = document.getElementById("lengthValue");

const uppercase = document.getElementById("uppercase");
const lowercase = document.getElementById("lowercase");
const numbers = document.getElementById("numbers");
const symbols = document.getElementById("symbols");

const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const resetBtn = document.getElementById("resetBtn");

const strengthText = document.getElementById("strengthText");
const strengthFill = document.getElementById("strengthFill");
const togglePassword = document.getElementById("togglePassword");

const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowerChars = "abcdefghijklmnopqrstuvwxyz";
const numberChars = "0123456789";
const symbolChars = "!@#$%^&*()_+-=[]{}<>?";

/* =========================================================
PASSWORD LENGTH SLIDER
Slider only changes the displayed length.
========================================================= */

length.addEventListener("input", function () {
lengthValue.textContent = length.value;
});

/* =========================================================
GENERATE PASSWORD BUTTON
========================================================= */

generateBtn.addEventListener("click", function () {
generatePassword();
});

/* =========================================================
SHOW / HIDE PASSWORD
========================================================= */

togglePassword.addEventListener("click", function () {


if (password.value === "") {
    return;
}

if (password.type === "password") {

    password.type = "text";
    togglePassword.textContent = "🙈";
    togglePassword.setAttribute("aria-label", "Hide password");
    togglePassword.setAttribute("title", "Hide password");

} else {

    password.type = "password";
    togglePassword.textContent = "👁️";
    togglePassword.setAttribute("aria-label", "Show password");
    togglePassword.setAttribute("title", "Show password");
}


});

/* =========================================================
COPY PASSWORD
========================================================= */

copyBtn.addEventListener("click", async function () {


if (password.value === "") {
    alert("Generate a password first!");
    return;
}

try {

    await navigator.clipboard.writeText(password.value);

    const oldText = copyBtn.textContent;

    copyBtn.textContent = "Copied!";

    setTimeout(function () {
        copyBtn.textContent = oldText;
    }, 1500);

} catch (error) {

    alert("Unable to copy the password. Please copy it manually.");
}


});

/* =========================================================
RESET BUTTON
========================================================= */

resetBtn.addEventListener("click", function () {


length.value = 12;
lengthValue.textContent = "12";

uppercase.checked = true;
lowercase.checked = true;
numbers.checked = true;
symbols.checked = true;

password.value = "";
password.type = "password";

togglePassword.textContent = "👁️";
togglePassword.setAttribute("aria-label", "Show password");
togglePassword.setAttribute("title", "Show or hide password");

strengthText.textContent = "Strong";
strengthText.style.color = "green";

strengthFill.style.width = "100%";
strengthFill.style.background = "green";
strengthFill.setAttribute("aria-valuenow", "100");


});

/* =========================================================
GENERATE PASSWORD
========================================================= */

function generatePassword() {


let selectedSets = [];

if (uppercase.checked) {
    selectedSets.push(upperChars);
}

if (lowercase.checked) {
    selectedSets.push(lowerChars);
}

if (numbers.checked) {
    selectedSets.push(numberChars);
}

if (symbols.checked) {
    selectedSets.push(symbolChars);
}


/* No option selected */

if (selectedSets.length === 0) {

    alert("Please select at least one character option.");

    password.value = "";

    strengthText.textContent = "Weak";
    strengthText.style.color = "red";

    strengthFill.style.width = "0%";
    strengthFill.style.background = "transparent";

    return;
}


const passwordLength = Number(length.value);


/* Password must be long enough for selected types */

if (passwordLength < selectedSets.length) {

    alert("Password length is too short for the selected character options.");

    return;
}


let pass = "";


/* Add one character from every selected type */

for (let i = 0; i < selectedSets.length; i++) {

    pass += getSecureRandomCharacter(selectedSets[i]);
}


/* Combined character set */

const allChars = selectedSets.join("");


/* Fill remaining characters */

while (pass.length < passwordLength) {

    pass += getSecureRandomCharacter(allChars);
}


/* Shuffle password */

pass = secureShuffle(pass);


/* Display password */

password.value = pass;
password.type = "password";

togglePassword.textContent = "👁️";
togglePassword.setAttribute("aria-label", "Show password");
togglePassword.setAttribute("title", "Show or hide password");


/* Update strength */

updateStrength(pass.length, selectedSets.length);


}

/* =========================================================
SECURE RANDOM CHARACTER
========================================================= */

function getSecureRandomCharacter(charSet) {


const randomArray = new Uint32Array(1);

crypto.getRandomValues(randomArray);

const randomIndex = randomArray[0] % charSet.length;

return charSet[randomIndex];


}

/* =========================================================
SECURE SHUFFLE
========================================================= */

function secureShuffle(value) {


const array = value.split("");

for (let i = array.length - 1; i > 0; i--) {

    const randomArray = new Uint32Array(1);

    crypto.getRandomValues(randomArray);

    const randomIndex = randomArray[0] % (i + 1);

    const temp = array[i];

    array[i] = array[randomIndex];

    array[randomIndex] = temp;
}

return array.join("");


}

/* =========================================================
PASSWORD STRENGTH
========================================================= */

function updateStrength(passLength, characterTypes) {


let score = 0;


/* Length score */

if (passLength >= 8) {
    score++;
}

if (passLength >= 12) {
    score++;
}

if (passLength >= 16) {
    score++;
}


/* Character type score */

if (characterTypes >= 2) {
    score++;
}

if (characterTypes >= 3) {
    score++;
}

if (characterTypes === 4) {
    score++;
}


/* Weak */

if (score <= 2) {

    strengthText.textContent = "Weak";
    strengthText.style.color = "red";

    strengthFill.style.width = "33%";
    strengthFill.style.background = "red";

    strengthFill.setAttribute("aria-valuenow", "33");
}


/* Medium */

else if (score <= 4) {

    strengthText.textContent = "Medium";
    strengthText.style.color = "orange";

    strengthFill.style.width = "66%";
    strengthFill.style.background = "orange";

    strengthFill.setAttribute("aria-valuenow", "66");
}


/* Strong */

else {

    strengthText.textContent = "Strong";
    strengthText.style.color = "green";

    strengthFill.style.width = "100%";
    strengthFill.style.background = "green";

    strengthFill.setAttribute("aria-valuenow", "100");
}


strengthFill.setAttribute("aria-valuemin", "0");
strengthFill.setAttribute("aria-valuemax", "100");


}

/* =========================================================
INITIAL PASSWORD
========================================================= */

generatePassword();

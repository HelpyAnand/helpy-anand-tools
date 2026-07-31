const password = document.getElementById("password");
const length = document.getElementById("length");
const lengthValue = document.getElementById("lengthValue");

const uppercase = document.getElementById("uppercase");
const lowercase = document.getElementById("lowercase");
const numbers = document.getElementById("numbers");
const symbols = document.getElementById("symbols");

const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const strengthText = document.getElementById("strengthText");

const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowerChars = "abcdefghijklmnopqrstuvwxyz";
const numberChars = "0123456789";
const symbolChars = "!@#$%^&*()_+-=[]{}<>?";

const togglePassword = document.getElementById("togglePassword");
const strengthFill = document.getElementById("strengthFill");

length.addEventListener("input", () => {
    lengthValue.textContent = length.value;
    generatePassword();
});

generateBtn.addEventListener("click", generatePassword);

copyBtn.addEventListener("click", () => {

    if(password.value === ""){
        alert("Generate a password first!");
        return;
    }

    navigator.clipboard.writeText(password.value);
    alert("Password Copied!");
});
togglePassword.addEventListener("click", () => {

    if(password.type === "password"){

        password.type = "text";
        togglePassword.textContent = "🙈";

    }else{

        password.type = "password";
        togglePassword.textContent = "👁️";

    }

});

function generatePassword(){

    let chars = "";

    if(uppercase.checked) chars += upperChars;
    if(lowercase.checked) chars += lowerChars;
    if(numbers.checked) chars += numberChars;
    if(symbols.checked) chars += symbolChars;

    if(chars === ""){
        alert("Please select at least one option.");
        return;
    }

    let pass = "";

    for(let i=0; i<length.value; i++){

        const randomIndex = Math.floor(Math.random()*chars.length);
        pass += chars[randomIndex];

    }

    password.value = pass;
    password.type = "password";
togglePassword.textContent = "👁️";
    updateStrength(pass);
}

function updateStrength(pass){

    if(pass.length < 8){

        strengthText.textContent = "Weak";
        strengthText.style.color = "red";

        strengthFill.style.width = "33%";
        strengthFill.style.background = "red";

    }

    else if(pass.length < 14){

        strengthText.textContent = "Medium";
        strengthText.style.color = "orange";

        strengthFill.style.width = "66%";
        strengthFill.style.background = "orange";

    }

    else{

        strengthText.textContent = "Strong";
        strengthText.style.color = "green";

        strengthFill.style.width = "100%";
        strengthFill.style.background = "green";

    }

}
generatePassword();
uppercase.addEventListener("change", generatePassword);
lowercase.addEventListener("change", generatePassword);
numbers.addEventListener("change", generatePassword);
symbols.addEventListener("change", generatePassword);
function generatePassword() {

    let length = document.getElementById("length").value;

    let uppercase = document.getElementById("uppercase").checked;
    let lowercase = document.getElementById("lowercase").checked;
    let numbers = document.getElementById("numbers").checked;
    let symbols = document.getElementById("symbols").checked;

    let chars = "";

    if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
    if (numbers) chars += "0123456789";
    if (symbols) chars += "!@#$%^&*()_+?><:{}[]";

    if (chars === "") {
        alert("Please select at least one option.");
        return;
    }

    let password = "";

    for (let i = 0; i < length; i++) {
        let random = Math.floor(Math.random() * chars.length);
        password += chars[random];
    }

    document.getElementById("password").value = password;
    checkStrength(password);
}

function copyPassword() {

    let password = document.getElementById("password");

    if (password.value === "") {
        alert("Generate password first.");
        return;
    }

    password.select();
    navigator.clipboard.writeText(password.value);

    alert("Password Copied Successfully!");
}
function togglePassword(){

    let password = document.getElementById("password");

    if(password.type==="password"){
        password.type="text";
    }else{
        password.type="password";
    }

}
function checkStrength(password){

    let strength = document.getElementById("strength");
    let bar = document.getElementById("strength-bar-fill");

    let score = 0;

    if(password.length >= 8) score++;
    if(/[A-Z]/.test(password)) score++;
    if(/[a-z]/.test(password)) score++;
    if(/[0-9]/.test(password)) score++;
    if(/[^A-Za-z0-9]/.test(password)) score++;

    if(score <= 2){
        strength.innerHTML = "🔴 Strength : Weak";
        strength.style.color = "red";

        bar.style.width = "33%";
        bar.style.background = "red";
    }
    else if(score == 3 || score == 4){
        strength.innerHTML = "🟡 Strength : Medium";
        strength.style.color = "orange";

        bar.style.width = "66%";
        bar.style.background = "orange";
    }
    else{
        strength.innerHTML = "🟢 Strength : Strong";
        strength.style.color = "green";

        bar.style.width = "100%";
        bar.style.background = "green";
    }

}
    


function countText(){

    let text = document.getElementById("text").value;

    let words = text.trim();

    if(words===""){
        document.getElementById("words").innerHTML=0;
    }else{
        document.getElementById("words").innerHTML=words.split(/\s+/).length;
    }

    document.getElementById("characters").innerHTML=text.length;

}
function copyText() {
    let text = document.getElementById("text");

    if(text.value==""){
        alert("Please enter some text first.");
        return;
    }

    text.select();
    navigator.clipboard.writeText(text.value);

    alert("Text Copied Successfully!");
}

function clearText() {
    document.getElementById("text").value = "";
    countText();
}
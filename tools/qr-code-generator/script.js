function generateQR(){

    let qrText = document.getElementById("qrText").value.trim();
    let qrImage = document.getElementById("qrImage");

    if(qrText==""){
        alert("Please enter text or URL.");
        return;
    }

    qrImage.src =
    "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data="
    + encodeURIComponent(qrText);

    qrImage.style.display="block";
}


function downloadQR(){

    let qrImage=document.getElementById("qrImage");

    if(qrImage.style.display=="none" || qrImage.src==""){
        alert("Generate QR Code first.");
        return;
    }

    let link=document.createElement("a");
    link.href=qrImage.src;
    link.download="QRCode.png";
    link.click();

}


function clearQR(){

    document.getElementById("qrText").value="";
    document.getElementById("qrImage").style.display="none";
    document.getElementById("qrImage").src="";

}
$(function(){
    $("#connect").on("click",function(){
        $.ajax({
            url: "http://localhost:8080/login",
            type: "POST",
            data: JSON.stringify({
                "username": $("#username").val(),
                "password": $("#password").val(),
                "room": $('#room option:selected').val()
            }),
            success:function(data){
                if(data != null){
                    window.location = '/board/board.html';
                }else{
                    alert("fail!!")
                }
            },
            headers: {
                "Content-Type":"application/json", 
            }
         })
        
    });
});


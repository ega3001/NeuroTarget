$(document).ready(()=>{
    $("#new-password").focusout(function () {
        let buf1 = $("#new-password").val();
        let buf2 = $("#confirm-new-password").val();
        let reg = /^[A-Za-z0-9]{5,}$/;
        if(!reg.test(buf1)) {
            $("#new-password").addClass('is-invalid');
        }else{
            $("#new-password").removeClass('is-invalid');
        }
        if(buf1 !== buf2) {
            $("#confirm-new-password").addClass('is-invalid');
        }else{
            $("#confirm-new-password").removeClass('is-invalid');
        }
    });
    $("#confirm-new-password").focusout(function () {
        let buf1 = $("#new-password").val();
        let buf2 = $("#confirm-new-password").val();
        if(buf1 !== buf2) {
            $("#confirm-new-password").addClass('is-invalid');
        }else{
            $("#confirm-new-password").removeClass('is-invalid');
        }
    });
    $("#current-password").change(()=>{
        $("#current-password").removeClass('is-invalid');
    });
    $('#reg').click(()=>{
        let buf0 = $("#current-password").val();
        let buf1 = $("#new-password").val();
        let buf2 = $("#confirm-new-password").val();
        if(buf1 === buf2) {
            $.ajax({
                url: '/change_password',
                method: 'POST',
                data: {oldPassword: buf0, newPassword: buf1},
                error: ()=>{
                    alert('Что-то пошло не так');
                },
                success: (data)=>{
                    if(data === 'Success'){
                        $(".alert").remove();
                        $(`<div class="alert alert-dismissible alert-success">
                            <button type="button" class="close" data-dismiss="alert">&times;</button>`
                            +'Пароль был успешно изменен'+
                            `</div>`).insertAfter(".logo-wrapper");
                    }else if(data === 'not login'){
                        console.log(data);
                    }else if(data === 'invalid password'){
                        $("#current-password").addClass('is-invalid');
                        $(".alert").remove();
                        $(`<div class="alert alert-dismissible alert-danger">
                            <button type="button" class="close" data-dismiss="alert">&times;</button>`
                            +'Ошибка! Недействительный пароль'+
                            `</div>`).insertAfter(".logo-wrapper");
                    }else if(data === 'too many requests'){
                        $(".alert").remove();
                        $(`<div class="alert alert-dismissible alert-danger">
                            <button type="button" class="close" data-dismiss="alert">&times;</button>`
                            +'Ошибка! Сервер нагружен'+
                            `</div>`).insertAfter(".logo-wrapper");
                    } else {
                        $(".alert").remove();
                        $(`<div class="alert alert-dismissible alert-danger">
                            <button type="button" class="close" data-dismiss="alert">&times;</button>`
                            +'Ошибка!'+
                            `</div>`).insertAfter(".logo-wrapper");
                    }
                }
            })
        }
    });
});
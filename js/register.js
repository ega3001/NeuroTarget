$(document).ready(() => {

    $("#loginOnForm").focusout(function () {
        let buf = $("#loginOnForm").val();
        let reg = /^[-._a-zA-Z0-9]+@(?:[a-z0-9][-a-z0-9]+\.)+[a-z]{2,6}$/;
        if (!reg.test(buf)) {
            $("#loginOnForm").addClass('is-invalid');
        } else {
            $("#loginOnForm").removeClass('is-invalid')
        }
    });

    $("#passOnForm").focusout(function () {
        let buf1 = $("#passOnForm").val();
        let buf2 = $("#passConfOnForm").val();
        let reg = /^[A-Za-z0-9]{5,}$/;
        if (!reg.test(buf1)) {
            $("#passOnForm").addClass('is-invalid');
        } else {
            $("#passOnForm").removeClass('is-invalid')
        }
        if (buf1 !== buf2) {
            $("#passConfOnForm").addClass('is-invalid');
        } else {
            $("#passConfOnForm").removeClass('is-invalid')
        }
    });

    $("#passConfOnForm").focusout(function () {
        let buf1 = $("#passOnForm").val();
        let buf2 = $("#passConfOnForm").val();
        if (buf1 !== buf2) {
            $("#passConfOnForm").addClass('is-invalid');
        } else {
            $("#passConfOnForm").removeClass('is-invalid')
        }
    });

    $('#reg').click(() => {
        $('.alert').remove();
        let email = $('#loginOnForm').val();
        let pass = $('#passOnForm').val();
        let varpass = $('#passConfOnForm').val();
        if (pass === varpass) {
            let reg = /^[A-Za-z0-9]{5,}$/;
            if (reg.test(pass)) {
                if(register(email, pass))
                    location = '/';
            } else {
                throw_error('Ошибка! Пароль должен состоять из английских букв и цифр, а также иметь длину не менее 5 символов');
            }
        } else {
            throw_error('Ошибка! Проверьте правильность ввода пароля');
        }
    });

    let register = (email, pass, invite) => {
        clear_error_messages();
        let flag = false;
        $.ajax({
            url: '/register',
            data: {
                email: email,
                pass: pass
            },
            method: 'POST',
            async: false,
            error: () => {
                throw_error('Ошибка! Сервер не отвечает, обратитесь в тех. поддержку');
            },
            success: (data) => {
                console.log('data_register: ' + data);
                if (data === 'Success') {
                    flag = true;
                } else {
                    throw_error(data);
                    flag = false;
                }
            }
        });
        return flag;
    };

    let throw_error = (text) => {
        $(`<div class="alert alert-dismissible alert-danger" style="width:366.34px">
            <button type="button" class="close" data-dismiss="alert">&times;</button>` +
            text +
            `</div>`).insertAfter("#title");
    };

    function clear_error_messages() {
        $(".alert").remove();
    }
});
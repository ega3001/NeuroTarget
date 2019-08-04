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
        let invite = $('#inputTokenOnForm').val();
        if (pass === varpass) {
            let reg = /^[A-Za-z0-9]{5,}$/;
            if (reg.test(pass)) {
                if (check_invite(invite) === true) {
                    let id = register(email, pass);
                    console.log('id: ' + id);
                    if (id >= 0) {
                        if (!connect_invite(invite, id)) {
                            delete_register(id);
                            throw_error('Неизвестная ошибка! Попробуйте еще раз');
                        } else {
                            location = '/';
                        }
                    } else if (id != -1) {
                        throw_error('Ошибка! Регистрация не удалась, попробуйте позже');
                    }
                } else {
                    throw_error('Ошибка! Неверный invite код или он уже использован');
                }
            } else {
                throw_error('Ошибка! Пароль должен состоять из английских букв и цифр, а также иметь длину не менее 5 символов');
            }
        } else {
            throw_error('Ошибка! Проверьте правильность ввода пароля');
        }
    });

    let delete_register = (id) => {
        let result = false;
        $.ajax({
            url: '/delete_register',
            method: 'POST',
            data: {
                id: id
            },
            async: false,
            success: (data) => {
                if (data === 'Success')
                    result = true;
                else
                    result = false;
            }
        });
        return result;
    };

    let connect_invite = (invite, id) => {
        let connect = false;
        $.ajax({
            url: '/connect_invite',
            method: 'POST',
            async: false,
            data: {
                invite: invite,
                id: id
            },
            error: () => {
                alert('Что-то пошло не так #3');
            },
            success: (data) => {
                console.log('data_connect: ' + data);
                if (data === 'Success')
                    connect = true;
                else
                    connect = false;
            }
        });
        return connect;
    };

    function check_invite(invite) {
        let check = false;
        $.ajax({
            url: '/check_invite',
            data: {
                invite: invite
            },
            async: false,
            method: 'POST',
            error: () => {
                alert('Что-то пошло не так #2');
            },
            success: (data) => {
                console.log('data_check: ' + data);
                if (data === 'Success') {
                    check = true;
                } else
                    check = false;
            }
        });
        return check;
    }

    let register = (email, pass) => {
        clear_error_messages();
        let id = -1;
        $.ajax({
            url: '/register',
            data: {
                email: email,
                pass: pass
            },
            method: 'POST',
            async: false,
            error: () => {
                alert('Что-то пошло не так #1');
            },
            success: (data) => {
                console.log('data_register: ' + data);
                if (data === 'user already exists') {
                    throw_error('Ошибка! Пользователь с таким логином уже существует');
                } else if (data === 'invalid password') {
                    throw_error('Ошибка! Проверьте правильность ввода пароля');
                } else if (data === 'invalid email address') {
                    throw_error('Ошибка! Проверьте правильность ввода e-mail');
                } else if (data === 'too many requests') {
                    throw_error('Ошибка! Сервер нагружен, попробуйте еще раз');
                } else if (data === 'try another one') {
                    throw_error('Ошибка регистрации, попробуйте еще раз');
                } else {
                    id = data;
                }
            }
        });
        return id;
    };

    let throw_error = (text) => {
        // $(".alert").remove();
        $(`<div class="alert alert-dismissible alert-danger" style="width:366.34px">
            <button type="button" class="close" data-dismiss="alert">&times;</button>` +
            text +
            `</div>`).insertAfter("#title");
    };

    function clear_error_messages() {
        $(".alert").remove();
    }
});
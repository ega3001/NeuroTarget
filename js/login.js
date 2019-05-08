$(document).ready(()=>{
    
    $('#login-button').click(()=> {

        // $('.alert').remove();

        let email = $('#loginOnForm').val();

        let pass = $('#passOnForm').val();

        let reg = /^[A-Za-z0-9]{5,}$/;

        if (reg.test(pass)) {

            $.ajax({

                url: '/login',

                data: {email: email, pass: pass},

                // async: false,

                method: 'POST',

                error: (s) => {

                    alert('Что-то пошло не так #1');

                    console.log('Что-то пошло не так #1');

                    console.log(s);

                },

                success: (data) => {

                    console.log('data');

                    console.log(data);

                    if (data === 'Success') {

                        location = '/';

                    } else if (data === 'email not verified') {

                        throw_error('Ошибка! Пользователь с таким e-mail не подтвержден');

                    } else if (data === 'wrong password') {

                        throw_error('Ошибка! Проверьте правильность ввода пароля');

                    } else if (data === 'wrong email address') {

                        throw_error('Ошибка! Проверьте правильность ввода e-mail');

                    }else if (data === 'try another one') {

                        throw_error('Ошибка! Регистрация была не успешной, обратитесь за помощью в отдел тех. поддержки');

                    } else if (data === 'too many requests') {

                        throw_error('Ошибка! Сервер нагружен, попробуйте позже');

                    }

                }

            });

        } else {

            throw_error('Ошибка! Пароль не удовлетворяет мин. требованиям');

        }

    });

    let throw_error = (text)=>{

        $(".alert").remove();

        $(`<div class="alert alert-dismissible alert-danger" style="width:329.31px">

            <button type="button" class="close" data-dismiss="alert">&times;</button>`

            +text+

            `</div>`).insertAfter("#title");

    };

});
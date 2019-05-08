$(document).ready(()=>{



    function ShowLoadWheel() {

        $(".loader-wrapper").css("display", "flex");

        $("body").addClass("body-in-load");

    };

    function HideLoadWheel() {

        $(".loader-wrapper").css("display", "none");

        $("body").removeClass("body-in-load");

    };

    function InsertMessage(msg) {

        $("#responseUpload .modal-body div").text(msg);

        // $("#responseUpload .modal-body").append("<div>" + msg + "</div>");

    };

    function ShowResponseModal() {

        $("#responseUpload").modal("show");

    };



    let file = [];



    $('input[type=file]').on("change", function() {

        // Загружает файл в переменную file

        file = this.files[0];

    });



	$("#load-btn").on("click", function(event) {



        ShowLoadWheel();



        // Добавление в очередь

        let queryName = $("#query-input").val();



        console.log("Query name: " + queryName);

        console.log("File content: " + file);



		if(!queryName || !file){

            HideLoadWheel();

            InsertMessage("Заполните все поля");

            ShowResponseModal();

			return;

		}



        event.stopPropagation(); // Остановка происходящего

        event.preventDefault();  // Полная остановка происходящего

        

        let data = new FormData();

        data.append('file', file);

        data.append('queryName', queryName);



        $.ajax({

            url: '/load_file',

            method: 'POST',

            data: data,

            cache: false,

            processData: false, // Не обрабатываем файлы (Don't process the files)

            contentType: false, // Так jQuery скажет серверу что это строковой запрос

            success: function(respond){

                data.delete('queryName');



                console.log("Respond after /load_file: " + respond);

                

                respond = JSON.parse(respond);



                if (!respond.success) {

                    console.log(respond.data);

                    HideLoadWheel();

                    InsertMessage(respond.data);

                    ShowResponseModal();

                    return;

                }



                $.ajax({

                    url: '/uploadFiles', // Сохранение файла в папку 'userfiles' на сервере

                    type: 'POST',

                    data: data,

                    cache: false,

                    processData: false,

                    contentType: false,

                    success: function( respond, textStatus, jqXHR ){



                        if( typeof respond.error !== 'undefined' ){

                            console.log('ОШИБКИ ОТВЕТА сервера: ' + respond.error );

                            HideLoadWheel();

                            InsertMessage('ОШИБКИ ОТВЕТА сервера: ' + respond.error);

                            ShowResponseModal();

                            return;

                        }

                        console.log(jqXHR);

                        fileName = JSON.parse(jqXHR.responseText).file;



                        let process_info = { file: fileName };



                        $.ajax({

                            url: "/getUserPhotosLinks", // Добавление в очередь

                            data: {

                                info: JSON.stringify(process_info),

                                queryName : queryName

                            },

                            success: function(respond){

                                console.log("Respond after /getUserPhotosLinks: " + respond);

                                HideLoadWheel();

                                InsertMessage("Запрос успешно создан");

                                ShowResponseModal();



                                //Очистить поля загрузки файла и ввода имени запроса

                                $('#query-input').val(null);

                                $('#file-input').val(null);

                                file = [];

                            },

                            error: function(jqXHR, textStatus, errorThrown) {

                                console.log('Ошибки AJAX запроса: ' + textStatus);

                                HideLoadWheel();

                                InsertMessage('Ошибки AJAX запроса: ' + textStatus);

                                ShowResponseModal();

                            }

                        });

                    },

                    error: function( jqXHR, textStatus, errorThrown ){

                        console.log( errorThrown );

                        console.log('Ошибки AJAX запроса: ' + textStatus );

                        HideLoadWheel();

                        InsertMessage('Ошибки AJAX запроса: ' + textStatus);

                        ShowResponseModal();

                    }

                });

            },

            error: function( jqXHR, textStatus, errorThrown ){

                console.log( errorThrown );

                console.log('Ошибки AJAX запроса: ' + textStatus );

                HideLoadWheel();

                InsertMessage('Ошибки AJAX запроса: ' + textStatus);

                ShowResponseModal();

            }

        });



    });

});
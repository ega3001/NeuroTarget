$(document).ready(() => {

  updatePointer();
  updateQueryName();

  ShowTags();
  ShowPhotos();

  function $_GET(key) {
    let p = window.location.search;
    p = p.match(new RegExp(key + "=([^&=]+)"));
    return p ? p[1] : false;
  }

  function getXmlHttp() {
    var xmlhttp;
    try {
      xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {
      try {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
      } catch (E) {
        xmlhttp = false;
      }
    }
    if (!xmlhttp && typeof XMLHttpRequest != "undefined") {
      xmlhttp = new XMLHttpRequest();
    }
    return xmlhttp;
  }

  function updatePointer() {
    $(".fas.fa-arrow-circle-right.active").removeClass("active");
    $("#" + $_GET("que")).find(".fas.fa-arrow-circle-right").addClass("active");
  }
  
  function updateQueryName() {
    var queryName = $("#" + $_GET("que")).find("a").text().substr(3);
    $("#title").prepend("<h2>" + queryName + "</h2>");
  }
  
  function ajaxSelect2Options(data) {
    $('.js-example-basic-multiple').select2({
      //minimumInputLength: 3,
      ajax: {
        url: '/get_options',
        type: 'post',
        dataType: 'json',
        data: function(params) {
          console.log("PARAMS:");
          console.log(params);
          var query = {
            search: params.term,
            data: data
          }
          console.log(query);
          return query;
        },
        processResults: function(data) {
          console.log(data);
          return {results: data};
        }
      }
    });
  }

  function ShowLoadWheel() {
      $(".loader-wrapper").css("display", "flex");
      $("body").addClass("body-in-load");
  };

  function HideLoadWheel() {
      $(".loader-wrapper").css("display", "none");
      $("body").removeClass("body-in-load");
  };

  var isTagsCompleted = false;
  var isPhotosCompleted = false;

  function ShowTags() {
    // Удаление содержимого таблицы тегов
    $(".custom").remove();

    let selected_tags = $("#select2").val();
    
    let tags = [];
    $(".modal-body-item").each(function() {
      tags.push($(this).children("div")[0].innerText);
    });

    let mainPercent = $("#range1").val();

    let pers = [];
    $(".modal-body-item .ranger-tag .ranger-margin input").each(function() {
      pers.push($(this).val() > mainPercent ? $(this).val() : mainPercent); 
    });

    $.ajax({  
      url: "/get_tags_from_query",
      method: "POST",
      async: true,
      data: {
        id: $_GET("que"),
        tags: tags,
        per: mainPercent,
        pers: pers//,
        //comp: Number($("#inversionCheck").prop("checked"))
      },
      beforeSend: () => {
        ShowLoadWheel();
        isTagsCompleted = false;
      },
      complete: () => {
        isTagsCompleted = true;
        if (isTagsCompleted && isPhotosCompleted) {
            HideLoadWheel();
        }
      },
      success: data => {
        console.log("Returned tags: " + data);
        if (data !== "Failed") {
          data = JSON.parse(data);
          console.log(data);
        //   data.push({id:'+', text: '+'});
          ajaxSelect2Options(data);

          // for (let i = 0; i < data.length; i++) { // 11.03 HEAD
          //   // Показ первых 50 тегов в таблице
          //   if (i <= 50) {
          //     $(
          //       '<tr class="custom"><td>' +
          //         data[i]['TagName'] +
          //         "</td>"
          //       ).appendTo("tbody");
          //   }
          //   else {
          //     break;
          //   }
          // }
        }
      }
    });
  }

  function ShowPhotos() {
    $(".photo").remove();
    console.log("REMOVE");

    let tags = [];
    $(".modal-body-item").each(function() {
      tags.push($(this).children("div")[0].innerText);
    });

    let mainPercent = $("#range1").val();

    let pers = [];
    $(".modal-body-item .ranger-tag .ranger-margin input").each(function() {
      pers.push($(this).val() > mainPercent ? $(this).val() : mainPercent); 
    });

    // let tag_contents = $(".tag-in-modal");
    // let per_contents = $(".modal-tag-range");
    // let tags = [];
    // let pers = [];
    // for (let i = 0; i < tag_contents.length; i++)
    //   tags.push(tag_contents[i].innerText);
    // for (let i = 0; i < per_contents.length; i++)
    //   pers.push(per_contents[i].value);
    console.log("Tags: " + tags);
    console.log("Percent of tags: " + pers);

    $.ajax({
      url: "/get_users_from_query",
      method: "GET",
      async: true,
      data: {
        query: $_GET("que"),
        tags: tags,
        per: $("#range1").val(),
        pers: pers,
        //comp: Number($("#inversionCheck").prop("checked"))
      },
      beforeSend: () => {
        ShowLoadWheel();
        isPhotosCompleted = false;
      },
      complete: () => {
        isPhotosCompleted = true;
        if (isTagsCompleted && isPhotosCompleted) {
           HideLoadWheel();
        }
      },
      success: data => {
        if (data !== "Failed") {
          console.log("JSON from /get_users_from_query" + data);
          data = JSON.parse(data);

          $(".photo").remove();
          let limit = Math.min(data.length, 80); // 11.03 HEAD
          for (let i = 0; i < limit; i++) {      // 11.03 HEAD
            $(
              '<div class="photo"><img src="' + data[i]['AvatarURL'] + '"></div>'
            ).appendTo("#gallery");
          }

          $('<div style="margin-left: 10px">' + data.length + '</div>').appendTo('#users-stat'); // 11.03 HEAD
          $('#users-stat').text(data.length);  // 11.03 HEAD

        }
      }
    });
  }

  $("#range1").change(() => {
    ShowTags();
    ShowPhotos();
  });

  function createTagRanger(id) {
    $("#ranger-" + id).jRange({
        from: 0,
        to: 100,
        step: 5,
        scale: [0,20,40,60,80,100],
        format: '%s',
        width: 300,
        showLabels: true,
        snap: true
    });
  }

  function drawTag(tag) {
    var rangerDiv = '<div class="ranger-tag">\
                    <p>охват</p>\
                    <div class="ranger-margin">\
                      <input type="hidden" id="ranger-' + tag + '" value="20"/>\
                    </div>\
                    <p>точность</p>\
                  </div>'

    $('<div class="modal-body-item">\
        <div id="' + tag + '">' + tag.split('_').join(' ') + '</div>' +
        rangerDiv +
      '</div>'
    ).appendTo('#modal-tags');

    $('#ranger-' + tag).on('change', ()=>{
      ShowTags();
      ShowPhotos();
    })

    createTagRanger(tag);
  } 

  $('#select2').on('select2:select', function (e) {
    var data = e.params.data;

    // id не содержит пробел ('-' может содержаться в теге -> '_')
    var tag = data['id'].split(' ').join('_');

    drawTag(tag);

    ShowTags();
    ShowPhotos();
  });

  function undrawTag(tag) {
    $('#ranger-' + tag).off('change');
    
    $("#" + tag).parents(".modal-body-item").remove();
  }

  $('#select2').on('select2:unselect', function (e) {
    var data = e.params.data;
    var tag = data['id'].split(' ').join('_');

    undrawTag(tag);

    // ShowTags(); // 11.03 HEAD
    ShowPhotos();
  });


  $("#save").click(function() {
    // if (!confirm('Скачать файл?')) {
    //   return;
    // }

    $("#cancel").click();

    let mainPercent = $("#range1").val();

    let tags = [];
    $(".modal-body-item").each(function() {
      tags.push($(this).children("div")[0].innerText);
    });

    let pers = [];
    $(".modal-body-item .ranger-tag .ranger-margin input").each(function() {
      pers.push($(this).val() > mainPercent ? $(this).val() : mainPercent); 
    });

    let per = $("#range1").val();
    document.location =
      "/save_users_from_query?query=" +
      $_GET("que") +
      "&tags=" +
      JSON.stringify(tags) +
      "&per=" +
      JSON.stringify(per) +
      "&pers=" +
      JSON.stringify(pers);
      "&comp=" +
      $("#inversionCheck").prop("checked");
    // let req = getXmlHttp();
    // req.open('POST', '/save_users_from_query', true);
    // req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); // Отправляем кодировку
    // req.send('query='+$_GET('que')+'&tags='+tags );
    // req.onreadystatechange = function() { // Ждём ответа от сервера
    // if (req.readyState == 4) { // Ответ пришёл
    // if(req.status == 200) { // Сервер вернул код 200 (что хорошо)
    // console.log(req.responseText); // Выводим ответ сервера
    // }
    // }
    // };

    // $.ajax({
    // url:'/save_users_from_query',
    // method:'POST',
    // async:false,
    // data:{query:$_GET('que'),tags:tags},
    // success: (data)=>{
    // if(data !== 'Failed'){
    // alert(data);

    // }
    // }
    // })
  });

  // $( function() {
  // let availableTags = [
  // "Кровля",
  // "Мужчина",
  // "Женщина",
  // "Строители"
  // ];
  // $( "#tags" ).autocomplete({
  // source: availableTags
  // });
  // });

  // $(".list-group-item").click(function() {
  // $(".list-group-item .active").removeClass("active");
  // $("> .oi-chevron-right", $(this)).addClass("active");
  // });

  $(document).on("click", ".modal-body-item .close", function() {
    let content = $(this)
      .siblings(".alert")
      .find(".tag-in-modal")
      .text();
    $(this)
      .parents(".modal-body-item")
      .remove();
    $(".choosen-tags-wrapper .tag-content:contains(" + content + ")")
      .parents(".alert")
      .remove();
    ShowTags();
    ShowPhotos();
  });

  $(document).on("click", ".choosen-tags-wrapper .close", function() {
    let content = $(this)
      .siblings(".tag-content")
      .text();
    $(".modal-body-item .tag-in-modal:contains(" + content + ")")
      .parents(".modal-body-item")
      .remove();
    ShowTags();
    ShowPhotos();
  });

  $(document).on(
    "input touchstart",
    ".modal-tag-range-wrapper .ranger",
    function() {
      $(this).siblings(".modal-tag-range-value")[0].innerHTML =
        $(this).val() + "%";
      ShowTags();
      ShowPhotos();
    }
  );

 
  $("#mnBT").click(() => {
    let sidebar = $(".sidebar");
    if ($(sidebar).css("left") == "-240px") {
      $(sidebar).css("left", "240px");
    } else {
      $(sidebar).css("left", "-240px");
    }
  });
});

<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link rel="stylesheet" href="../css/jquery.range.css">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
          integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
    <link rel="stylesheet" href="../css/filter.css">
    <link rel="stylesheet" href="../css/load-wheel.css">
    <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.5.0/css/all.css"
          integrity="sha384-B4dIYHKNBt8Bc12p+WXckhzcICo0wtJAoU8YZTY5qE0Id1GSseTk6S+L3BlXeVIU" crossorigin="anonymous">
    <title>NeuroTarget - Main Page</title>
</head>
<body>
<nav>
    <div class="menu">
        <div class="logo">
            <div class="menu-trigger">
                <i class="fas fa-bars"></i>
            </div>
            <h2>NeuroTarget</h2>
        </div>
        <button class="clusters" onclick="window.open('https://docs.google.com/document/d/1gYJFrq3_vUivpvXGsQGwxE0EnnsNTk8KHj48ogioSlU/edit?usp=sharing', '_blank')">
        Инструкция
        </button>
        <div class="cabinet">
            <div class="dropdown">
                <button class="dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown"
                        aria-haspopup="true" aria-expanded="false">
                    Личный кабинет
                </button>
                <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                    <a class="dropdown-item" href="/settings">Настройки</a>
                    <a class="dropdown-item" href="" id="exit">Выход</a>
                </div>
            </div>
        </div>
    </div>
</nav>
<div id="root">
    <div class="sidebar">
        <h3>Мои запросы</h3>
        <div class="padding-container">
            <a href="/load" class="btn btn-outline-light add-button"> + Добавить</a>
        </div>
        <div class="padding-container-full works-wrapper">
            <ul class="works">

            </ul>
        </div>
    </div>
    <div class="content">
        <div class="standard-margin-horz">
            <div class="standard-margin-vert">
                <div class="standard-background">
                    <div class="controls">
                        <div class="container-fluid">
                            <div class="flex row" id="title">
                                <h2><?=$_GET['name']?> - тэги/кластеры аудитории</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="standard-margin-horz">
            <div class="standard-margin-vert">
                <div class="standard-background">
                    <div class="controls">
                        <div class="container-fluid">
                            <div class='row'>
                                <?php
                                    $result = $dbhandler->GetTagsStatFromQuery($_GET['query'], "");
                                    foreach($result as $line):
                                ?>
                                    <h4><span class="badge badge-pill badge-primary m-3"><?=$line['TagName']?></span></h4>
                                <?php
                                    endforeach;
                                ?>
                                <?php
                                    $result = $dbhandler->GetClusters();
                                    foreach($result as $line):
                                ?>
                                    <h4><span class="badge badge-pill badge-primary m-3"><?=$line['ClusterName']?></span></h4>
                                <?php
                                    endforeach;
                                ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</body>

<script
        src="http://code.jquery.com/jquery-3.3.1.min.js"
        integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
        crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"
        integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49"
        crossorigin="anonymous"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"
        integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy"
        crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js"></script>
<script crossorigin src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>
<script src="https://npmcdn.com/babel-core@5.8.38/browser.min.js"></script>

<!-- Колесо заргузки -->
<div class="loader-wrapper">
    <div class="loader"></div>
</div>
<script src="../js/jquery.range.js"></script>
<script src="../js/index.js"></script>

<script src="../js/action_menu.js"></script>
</html>
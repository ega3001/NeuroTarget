<?php

$f = fopen('testFile.txt', 'w');
fwrite($f, $_POST['queryName']."\n");
fwrite($f, $_POST['userId']."\n");
fclose($f);

?>
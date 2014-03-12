<?php

  set_time_limit(3600);
  ini_set('memory_limit', '-1');

  header('Content-Type: text/event-stream');
  header('Cache-Control: no-cache');

  $i = 0;
  while (true) {
    echo 'data: ' . $i++ . PHP_EOL . PHP_EOL;
    ob_flush();
    flush();
    sleep(1);
  }

?>
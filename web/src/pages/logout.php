<?php

require_once __DIR__ . '/../main.inc.php';

session_unset();
session_destroy();

header('Location: ' . url('index.php'));
exit;
<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: origin, content-type, accept');
header('Content-Type: application/json');

$date = 'true';

echo json_encode($data);
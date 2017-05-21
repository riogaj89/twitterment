<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: origin, content-type, accept');
header('Content-Type: application/json');

// sleep(1);

echo json_encode(new StdClass());
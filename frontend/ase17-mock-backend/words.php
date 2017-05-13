<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: origin, content-type, accept');
header('Content-Type: application/json');

function word($text, $createdAt) {
	return array(
		'text' => $text,
		'createdAt' => $createdAt->format('U') * 1000
	);
}

$data = array(
	word('Donald Trump',        new DateTime('2017-03-20T10:10:10+02:00')),
	word('Justin Bieber',       new DateTime('2017-04-15T10:10:10+02:00')),
	word('Monkey',              new DateTime('2017-05-10T10:10:10+02:00')),
	word('Lambda',              new DateTime('2017-06-05T10:10:10+02:00'))
);

// sleep(1);

// echo '[]';
echo json_encode($data);
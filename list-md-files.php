<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Return the pre-generated file list
readfile('file-list.json');
?>
<?

/*
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH'])) {
    header('HTTP/1.0 403 Forbidden');
    die('You are not allowed to access this file.');     
}
*/

header('Content-type: application/json');
$url=$_GET['url'];
/*
$ctx = stream_context_create(array(
    'http' => array('timeout' => 5, 'protocol_version' => 1.1)
    ));
$json=file_get_contents($url, 0, $ctx);
*/
$ch = curl_init($url);

curl_setopt($ch, CURLOPT_URL, $url); 
curl_setopt($ch, CURLOPT_TIMEOUT, 10); 
curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
//curl_setopt($ch, CURLOPT_HEADER, 0);

echo curl_exec($ch); 
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
//echo $http_code;
if($http_code != 200) {
    //echo '{ error:"Unable to retrive content" }';
}
//echo $json;

curl_close($ch);

?>


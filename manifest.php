<?
$ignore = Array();
$ignore[] = "./build.number";
$ignore[] = "./build.xml";
$ignore[] = "./cache.manifest";
$ignore[] = "./config.xml";
$ignore[] = "./license.txt";
$ignore[] = "./readme.md";
$ignore[] = "./index.appcache";

$hash = "";
$data = "# Version 1.0 Build: XXX

CACHE MANIFEST\n";

// read all files and their hashes
$dir = new RecursiveDirectoryIterator(".");
foreach(new RecursiveIteratorIterator($dir) as $file) {
	if (substr($file, 0, 3) == './.') continue;
	if (substr($file, 0, 7) == './BUILD') continue;
	if (in_array($file, $ignore)) continue;
	if ($file->IsFile() && $file != "./manifest.php" && substr($file->getFileName(), 0, 1) != ".") $data .= $file."\n";
	$hash .= md5_file($file);
}
$data .= "\n# hash: ".md5($hash);

// if any file changed, then manifest should be reloaded
file_put_contents("index.appcache", $data);
//print($data."# hash: ".md5($hash));
?>
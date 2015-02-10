<?php

require_once dirname(__FILE__) . '/../lib/vendor/symfony/symfony1/lib/autoload/sfCoreAutoload.class.php';
require_once __DIR__ . '/../lib/vendor/composer/ClassLoader.php';

sfCoreAutoload::register();
$loader = new \Composer\Autoload\ClassLoader();
$map = require __DIR__ . '/../lib/vendor/composer/autoload_namespaces.php';
foreach ($map as $namespace => $path) $loader->set($namespace, $path);
$loader->register(true);


class ProjectConfiguration extends sfProjectConfiguration
{
    public function setup()
    {
        date_default_timezone_set('Etc/GMT-4');
        mb_internal_encoding('UTF-8');

        $this->enablePlugins('sfPropelORMPlugin', 'sfPhastPlugin', 'sfImageTransformPlugin');
    }

}

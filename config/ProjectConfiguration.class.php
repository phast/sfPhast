<?php

require_once dirname(__FILE__) . '/../lib/vendor/symfony/symfony1/lib/autoload/sfCoreAutoload.class.php';
sfCoreAutoload::register();


class ProjectConfiguration extends sfProjectConfiguration
{
    public function setup()
    {
        date_default_timezone_set('Etc/GMT-4');
        mb_internal_encoding('UTF-8');

        sfConfig::set('host', 'phast.ru');
        sfConfig::set('sf_propel_path', sfConfig::get('sf_lib_dir') . '/vendor/propel/propel1');
        sfConfig::set('sf_twig_lib_dir', sfConfig::get('sf_lib_dir') . '/vendor/twig/twig/lib');
        sfConfig::set('sf_phing_path', sfConfig::get('sf_lib_dir') . '/vendor/phing/phing');

        $this->enablePlugins('sfPropelORMPlugin', 'sfPhastPlugin');
    }
}

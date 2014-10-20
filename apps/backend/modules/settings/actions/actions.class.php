<?php

class settingsActions extends sfActions
{
	public function executeIndex(sfWebRequest $request){
		$user = $this->getUser();
		$editConstructor = $user->hasCredential('cp_settings_constructor');


		$list = (new sfPhastList(
		//----------------------------------
			'SettingList'
		//----------------------------------
		))
		->attach('#list');

		if($editConstructor){
			$list
				->addControl(['caption' => 'Добавить раздел', 'icon' => 'folder-add', 'action' => '&SettingSectionEditor'])
				->addControl(['caption' => 'Добавить настройку', 'icon' => 'fatcow-page-add', 'action' => '&SettingEditor'])
				;
		}

		$list
		->setColumns('Название', 'Идентификатор', '.', '.')
		->setLayout('
            {SettingSection
                @relation SettingSection.SECTION_ID
                @template title, *, .visible, .delete
                @action &SettingSectionEditor
                @icon folder
                @sort on
            }

            {Setting
                @relation SettingSection.SECTION_ID
                @template title, key,  .visible, .delete
                @action &SettingEditorw
                @icon fatcow-page
            }

        ');


		if($editConstructor){
			$action = '$$.Box.createContainerForList(
                    "SettingFieldList",
                    "Поля",
                    {owner: item.$pk},
                    {list: list}
                ).open();';

			$list
				->getPattern('SettingSection')
				->addControl(['caption' => 'Добавить раздел', 'icon' => 'folder-add', 'action' => '&SettingSectionEditor'])
				->addControl(['caption' => 'Добавить настройку', 'icon' => 'fatcow-page-add', 'action' => '&SettingEditor'])
				->getList()
				->getPattern('Setting')
				->addControl(['caption' => 'Конструктор полей', 'icon' => 'fatcow-layout-edit', 'action' => $action]);
		}

		(new sfPhastBox(
		//-------------------------
			'SettingSectionEditor'
		//-------------------------
		))
		->setTable('SettingSection')
		->setTemplate('

		    {#section Раздел
				@button Default
			}

			{section_id:choose, Родительский раздел
				@list SettingParentIdChoose
				@caption $item->getSettingSection()->getTitle()
				@empty Без раздела
				@header Выберить родительский раздел
			}

			{title, Название
				@required Введите название
			}

			{#button Default}

		')
		->setReceive(function($request, $response, $item){
			if(!$item){
				if($request['#relation'] and $relation = SettingSectionPeer::retrieveByPK($request['#relation'])) {
					$response['section_id'] = $relation->getId();
					$response['phast_choose_section_id'] = $relation->getTitle();
				}
			}
		});


		(new sfPhastBox(
		//-------------------------
			'SettingEditor'
		//-------------------------
		))
		->setTable('Setting')
		->setTemplate('

		    {#section Настройка
				@button Default
			}
		    '.($editConstructor ?
			'{section_id:choose, Родительский раздел
				@list SettingParentIdChoose
				@caption $item->getSettingSection()->getTitle()
				@empty Без раздела
				@header Выберить родительский раздел
				@required Выберите раздел
			}' : ''
		    ).'

		    '.($editConstructor ?
			'{title, Название
				@required Введите название
			}'
			: ''
			).'

			'.($editConstructor ?
			'{key, Идентификатор
				@required Введите идентификатор
			}'
			: ''
			).'


			<div class="form-section" style="margin-top: 7px;">
		        Сохраните настройку
			</div>

			{#event
				@beforeRender{
					var _this = this;
					node.find(".form-section").html(this.data.form);
				}
			}

			{#button Default}

		')
		->setReceive(function($request, $response, $item){
			if(!$item){
				if($request['#relation'] and $relation = SettingSectionPeer::retrieveByPK($request['#relation'])) {
					$response['section_id'] = $relation->getId();
					$response['phast_choose_section_id'] = $relation->getTitle();
				}
			}else{
				//Когда понадобиться будет result в зависимости от контекста
				$result = $item->getResult();
				$form = $item->renderForm($result);
				$response['form'] = $form ? $form : 'Поля настройки не добавлены';
			}

		})->setSave(function ($request, $response, Setting $item) use($editConstructor){

			if($editConstructor){
				$response->check();
				$request->autofill($item);
			}



			if(!$response->error()){
				$item->save();
				$result = $item->getResult();
				$item->saveFields($result);
				$response->pk($item);
			}

		});

		if($editConstructor){

			(new sfPhastList(
			//----------------------------------
				'SettingFieldList'
			//----------------------------------
			))
			->addControl(['caption' => 'Добавить поле', 'icon' => 'fatcow-layout-add', 'action' => '&SettingFieldEditor'])
			->setColumns('Название', 'Идентификатор', '.', '.')
			->setLayout('
	            {SettingField
	                @template title, key, .visible, .delete
	                @action &SettingFieldEditor
	                @icon fatcow-layout
	            }

	        ')
			->getPattern('SettingField')
			->setCriteria(function (SettingFieldQuery $query) use ($request) {
				$query->filterBySettingId($request['#owner']);
			});


			(new sfPhastBox(
			//-------------------------
				'SettingFieldEditor'
			//-------------------------
			))
			->setTable('SettingField')
			->setTemplate('

			    {#section Элемент настройки
					@button Default
				}

			    {type_id:select, Тип
			       @required Выберите тип
			    }

				{title, Название
					@required Укажите название
				}

				{key, Идентификатор
					@required Укажите идентификатор
				}

				{#list SettingOptionList
					@caption Значения списка
					@wait Сохраните объект
				}

				{#event
					@afterRender{
						node.find("select[name=type_id]").on("change", function(e){
		                    if($(this).val() == 5){
			                    node.find("[class^=\"SettingOptionList\"]").closest("dl").show();
			                }else{
			                    node.find("[class^=\"SettingOptionList\"]").closest("dl").hide();
			                }
						})
						.trigger("change")
						;
					}
				}

				{#button Default}
			')
			->setReceive(function($request, $response, $item){
				$response->select('type_id', SettingFieldPeer::getTypes(), null, null, true);
			})
			->setSave(function ($request, $response, SettingField $item){
			    $response->check();
				$request->autofill($item);
				$item->setSettingId($request['#owner']);
				$item->save();
				$response->pk($item);

			});


			(new sfPhastList(
			//----------------------------------
				'SettingOptionList'
			//----------------------------------
			))
			->addControl(['caption' => 'Добавить значение', 'icon' => 'silk-application-form-add', 'action' => '&SettingOptionEditor'])
			->setColumns('Название', '.')
			->setLayout('
	            {SettingOption
	                @template title, .delete
	                @action &SettingOptionEditor
	                @icon silk-application-form
	                @sort on
	            }

	        ')
			->getPattern('SettingOption')
			->setCriteria(function (SettingOptionQuery $query) use ($request) {
				$query->filterByFieldId($request['#owner']);
			});


			(new sfPhastBox(
			//-------------------------
				'SettingOptionEditor'
			//-------------------------
			))
			->setTable('SettingOption')
			->setTemplate('

			    {#section Значение для выбора из списка
					@button Default
				}


				{title, Название
					@required Укажите название
				}

				{#button Default}
			')
			->setReceive(function($request, $response, $item){
			})
			->setSave(function ($request, $response, SettingOption $item){
				$response->check();
				$request->autofill($item);
				$item->setFieldId($request['#owner']);
				$item->save();
				$response->pk($item);

			});



			(new sfPhastList(
			//----------------------------------
				'SettingParentIdChoose'
			//----------------------------------
			))
			->setColumns('Заголовок')
			->setLayout('
				{SettingSection
					@relation SettingSection.SECTION_ID
					@template title
					@action list.choose(item.$pk, item.title);
					@icon folder
				}
			');
		}
	}
}

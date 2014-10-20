<?php

class mailingActions extends sfActions
{
    public function executeIndex(sfWebRequest $request)
    {
        /**
         * @param sfPhastUser $user
         */
        $user = $this->getUser();

        (new sfPhastList(
        //----------------------------------
            'ChannelList'
        //----------------------------------
        ))
        ->attach('#list-channel')
        ->addControl(['caption' => 'Добавить канал', 'icon' => 'silk-table-add', 'action' => '&ChannelEditor'])
        ->setColumns('Канал', 'Идентификатор', 'Подписчики', '.')
        ->setLayout('
            {MailingChannel
                @fields subscribers:countMailingSubscriberRels
                @template title, name, :subscribers, .delete
                @action &ChannelEditor
                @icon silk-table

                :subscribers{
                    return $$.List.actionButton(":subscribersEditor", "silk-group", item.subscribers ? "<b>"+$$.morph(item.subscribers, "подписчик", "подписчика", "подписчиков", " ")+"</b>" : "нет подписчиков");
                }

                :subscribersEditor{
                    $$.Box.createForList("SubscribersList", "Подписчики канала «" + item.title + "»", {channel:item.$pk}, {
                        list:list,
                        events: {
                            afterClose: function(box){
                                box.list.load();
                            }
                        }}
			        ).open();
                }
            }
        ');


        (new sfPhastBox(
        //----------------------------------
            'ChannelEditor'
        //----------------------------------
        ))
        ->setTable('MailingChannel')
        ->setAutoClose()
        ->setTemplate('
			{#section Канал
				@button Default
			}

			{title, Название
				@required Введите название
			}

			{name, Идентификатор
				@required Укажите идентификатор
			}

			{#button Default}
		');


        (new sfPhastList(
        //----------------------------------
            'SubscribersList'
        //----------------------------------
        ))
        ->addControl(['caption' => 'Добавить подписчика', 'icon' => 'silk-user-add', 'action' => '&SubscriberEditor'])
        ->setColumns('Электронная почта', 'Имя', 'Пользователь', '.')
        ->setLayout('
            {MailingSubscriber
                @field user:getUserCaption
                @template email, title, :user, .delete
                @icon silk-user

                :user{
                    if(item.user){
                        return "";
                    }
                    return $$.List.iconCaption("silk-user", item.user);
                }

            }
        ')
        ->getPattern('MailingSubscriber')
        ->setCriteria(function(MailingSubscriberQuery $c) use ($request){
            $c->innerJoinMailingSubscriberRel();
            $c->addJoinCondition('MailingSubscriberRel', 'MailingSubscriberRel.ChannelId = ?', $request['#channel']);
        });

        (new sfPhastBox(
        //----------------------------------
            'SubscriberEditor'
        //----------------------------------
        ))
        ->setAutoClose()
        ->setTemplate('
			{#section Подписчик
				@button Default
			}

			{email, Электронная почта
				@required Укажите электронную почту
			}

			{title, Имя}

			{#button Default}
		')
        ->setSave(function($request, $response){

            if(!$channel = MailingChannelQuery::create()->findOneById($request['#channel'])){
                return $response->error('Канал не найден');
            }

            if(!$response->error()){

                $channel->subscribe($request['email'], $request['title']);

            }

        });


        ////////////////////////////////////////////////////////////////////////


        (new sfPhastList(
        //----------------------------------
            'ScheduleList'
        //----------------------------------
        ))
        ->attach('#list-schedule')
        ->setRefresh(30000)
        ->addControl(['caption' => 'Добавить расписание', 'icon' => 'silk-calendar-add', 'action' => '&ScheduleEditor'])
        ->setColumns('Расписание', 'Сценарий', 'План запуска', 'Следующий запуск', 'Каналы', '.')
        ->setLayout('
            {MailingSchedule
                @fields channels:countMailingScheduleRels
                @template title, composer, timetable, next:getNextRunDate, :channels, .delete
                @action &ScheduleEditor
                @icon silk-calendar

                :channels{
                    return $$.List.actionButton(":channelsEditor", "silk-table", item.channels ? "<b>"+$$.morph(item.channels, "канал", "канала", "каналов", " ")+"</b>" : "нет каналов");
                }

                :channelsEditor{
                    $$.Box.createForList("ChannelsList", "Каналы для расписания «" + item.title + "»", {pk:item.$pk}, {
                        list:list,
                        events: {
                            afterClose: function(box){
                                box.list.load();
                            }
                        }}
			        ).open();
                }
            }
        ');


        (new sfPhastBox(
        //----------------------------------
            'ScheduleEditor'
        //----------------------------------
        ))
        ->setTable('MailingSchedule')
        ->setAutoClose()
        ->setTemplate('
			{#section Расписание
				@button Default
			}

			{title, Название
				@required Введите название
			}

			{composer, Сценарий
				@required Укажите сценарий
			}

			{timetable, План запуска
			    @notice Минута - Час - День месяца - Месяц - День недели
				@required Задайте план запуска
			}

			{#button Default}
		');


        (new sfPhastList(
        //----------------------------------
            'ChannelsList'
        //----------------------------------
        ))
        ->setColumns('Канал', 'Идентификатор')
        ->setLayout(
            '
                {MailingChannel
                    @template title, name
                    @action{
                        var rowNode = node.closest("tr");
                        if(rowNode.hasClass("active")){
                            rowNode.removeClass("active");
                        }else{
                            rowNode.addClass("active");
                        }
                        this.pattern.request("choose", item.$pk, {success: function(){
                            list.box.getInnerList(0).load();
                        }});
                    }
                    @icon silk-table
                }
            '
        )
        ->setPrepare(function (sfPhastList $list) use ($request) {
            $activePks = array();
            if ($item = $request->getItem('MailingSchedule')) {
                foreach ($item->getMailingScheduleRels() as $rel) {
                    $activePks[] = $rel->getChannelId();
                }
            }
            $list->setParameter('activePks', $activePks);
        })
        ->getPattern('MailingChannel')
        ->setHandler('choose', function ($pattern, $request, $channel) {
            if ($channel && $schedule = $request->getItem('MailingSchedule')) {
                if ($rel = MailingScheduleRelQuery::create()->filterByMailingChannel($channel)->filterByMailingSchedule($schedule)->findOne()) {
                    $rel->delete();
                } else {
                    $rel = new MailingScheduleRel();
                    $rel->setMailingChannel($channel);
                    $rel->setMailingSchedule($schedule);
                    $rel->save();
                }
            }
            return array('success' => 1);
        })
        ->setDecorator(function (&$output, $item, $pattern) {
            $activePks = $pattern->getList()->getParameter('activePks');
            if (in_array($item->getId(), $activePks))
                $output['$class'] = 'active';
        });


        ////////////////////////////////////////////////////////////////////////


        (new sfPhastList(
        //----------------------------------
            'BroadcastList'
        //----------------------------------
        ))
        ->attach('#list-broadcast')
        ->setRefresh(5000)
        ->addControl(['caption' => 'Создать рассылку', 'icon' => 'silk-email-add', 'action' => '&BroadcastEditor'])
        ->setColumns('Расписание', 'План запуска', 'Каналы', '.', '.')
        ->setLayout('
            {MailingBroadcast
                @fields status, channels:countMailingBroadcastRels
                @template title, started:getStartedPlan, :channels, :status, .delete
                @action &BroadcastEditor
                @icon silk-email

                :channels{
                    return $$.List.actionButton(":channelsEditor", "silk-table", item.channels ? "<b>"+$$.morph(item.channels, "канал", "канала", "каналов", " ")+"</b>" : "нет каналов");
                }

                :channelsEditor{
                    $$.Box.createForList("BroadcastChannelsList", "Каналы для расписания «" + item.title + "»", {pk:item.$pk}, {
                        list:list,
                        events: {
                            afterClose: function(box){
                                box.list.load();
                            }
                        }}
			        ).open();
                }

                :status{
                    if(item.status == 2) return $$.List.iconCaption("silk-tick", null, "Отпавлено");
                    return $$.List.toggleButton("status", item.status, "silk-bullet-green", "silk-bullet-red");
                }
            }
        ')
        ->getPattern('MailingBroadcast')
        ->setHandler('status', function($pattern, $request, $item){
            /** @var MailingBroadcast $item */
            if($item->getStatus() == MailingBroadcast::STATUS_PREPARE){
                $item->setStatus(MailingBroadcast::STATUS_READY);
            }else if($item->getStatus() == MailingBroadcast::STATUS_READY){
                $item->setStatus(MailingBroadcast::STATUS_PREPARE);
            }else{
                return array('error' => 'Сообщение уже отправлено');
            }
            $item->save();
            return array('success' => 1);
        });


        (new sfPhastBox(
        //----------------------------------
            'BroadcastEditor'
        //----------------------------------
        ))
        ->setTable('MailingBroadcast')
        ->setAutoClose()
        ->setTemplate('
			{#section Рассылка
				@button Default
			}

			{title, Название
				@required Введите название
			}

			{content:textedit, Содержание
				@mode link
			}

			{started_date:calendar, Отправить не ранее даты}
			{started_time:text, Отправить не ранее времени}

			{#button Default}
		')
        ->setReceive(function($request, $response, $item){
            if($item){
                $response['started_date'] = sfPhastUtils::date(strtotime($item->getStartedAt()));
                $response['started_time'] = date('H:i', strtotime($item->getStartedAt()));
            }
        })
        ->setSave(function($request, $response, $item){
            if(!$request['started_date']) $request['started_date'] = date('d.m.Y');
            if(!$request['started_time']) $request['started_time'] = '00:00:00';

            $response->check();
            $request->autofill($item);
            $item->setStartedAt(date('Y-m-d H:i:0', sfPhastUtils::strtotime("{$request['started_date']} {$request['started_time']}")));
            $item->save();
            $response->pk($item);
        });


        (new sfPhastList(
        //----------------------------------
            'BroadcastChannelsList'
        //----------------------------------
        ))
        ->setColumns('Канал', 'Идентификатор')
        ->setLayout(
            '
                {MailingChannel
                    @template title, name
                    @action{
                        var rowNode = node.closest("tr");
                        if(rowNode.hasClass("active")){
                            rowNode.removeClass("active");
                        }else{
                            rowNode.addClass("active");
                        }
                        this.pattern.request("choose", item.$pk, {success: function(){
                            list.box.getInnerList(0).load();
                        }});
                    }
                    @icon silk-table
                }
            '
            )
        ->setPrepare(function (sfPhastList $list) use ($request) {
            $activePks = array();
            if ($item = $request->getItem('MailingBroadcast')) {
                foreach ($item->getMailingBroadcastRels() as $rel) {
                    $activePks[] = $rel->getChannelId();
                }
            }
            $list->setParameter('activePks', $activePks);
        })
        ->getPattern('MailingChannel')
        ->setHandler('choose', function ($pattern, $request, $channel) {
            if ($channel && $broadcast = $request->getItem('MailingBroadcast')) {
                if ($rel = MailingBroadcastRelQuery::create()->filterByMailingChannel($channel)->filterByMailingBroadcast($broadcast)->findOne()) {
                    $rel->delete();
                } else {
                    $rel = new MailingBroadcastRel();
                    $rel->setMailingChannel($channel);
                    $rel->setMailingBroadcast($broadcast);
                    $rel->save();
                }
            }
            return array('success' => 1);
        })
        ->setDecorator(function (&$output, $item, $pattern) {
            $activePks = $pattern->getList()->getParameter('activePks');
            if (in_array($item->getId(), $activePks))
                $output['$class'] = 'active';
        });


    }
}

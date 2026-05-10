import { motion } from "framer-motion";
import ManaLensNavbar from "@/components/ManaLensNavbar";
import Footer from "@/components/Footer";

const Section = ({ num, title, children }: { num: string; title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/20 text-primary text-sm font-bold shrink-0">
        {num}
      </span>
      {title}
    </h2>
    <div className="pl-9 space-y-3 text-sm text-muted-foreground leading-relaxed">
      {children}
    </div>
  </div>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
);

const PublicOffer = () => {
  return (
    <div className="min-h-screen bg-background">
      <ManaLensNavbar />

      <main className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              Публичная оферта
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Договор оказания услуг доступа к сервису
            </h1>
            <p className="text-muted-foreground text-sm">
              Сайт: <a href="https://hs-banhelper.online" className="text-primary hover:underline">hs-banhelper.online</a>
              &nbsp;·&nbsp; Дата публикации: 10 мая 2026 г.
            </p>
          </div>

          {/* Article body */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-2">

            <Section num="1" title="Общие положения">
              <P>
                Настоящая Публичная оферта (далее — «Оферта») является официальным предложением
                Самозанятого Суркова К.В. (ИНН 026413639226, далее — «Исполнитель») любому
                дееспособному физическому лицу (далее — «Пользователь») заключить договор оказания
                услуг доступа к онлайн-сервису на условиях, изложенных ниже, в соответствии с
                п. 2 ст. 437 Гражданского кодекса РФ.
              </P>
              <P>
                Акцептом настоящей Оферты является совершение Пользователем любого из следующих
                действий: регистрация учётной записи на Сайте; выбор и оплата тарифа; проставление
                отметки «Я ознакомлен и согласен с условиями публичной оферты» на странице оформления
                подписки. Акцепт означает полное и безоговорочное принятие всех условий Оферты.
              </P>

              <div className="mt-4 space-y-2">
                <p className="font-semibold text-foreground text-sm">Термины и определения:</p>
                <ul className="space-y-1.5 list-none">
                  <li><span className="text-foreground font-medium">Сайт</span> — онлайн-сервис, доступный по адресу <span className="text-primary">hs-banhelper.online</span>.</li>
                  <li><span className="text-foreground font-medium">Услуга</span> — предоставление Пользователю доступа к программным инструментам Сайта (калькулятор банов для турниров по Hearthstone) в рамках выбранного тарифного плана.</li>
                  <li><span className="text-foreground font-medium">Тарифный план</span> — набор функций и период доступа, выбираемые Пользователем при оформлении подписки.</li>
                  <li><span className="text-foreground font-medium">Личный кабинет</span> — персональный раздел Сайта, доступный после регистрации.</li>
                  <li><span className="text-foreground font-medium">Платёжная система</span> — Robokassa (<a href="https://robokassa.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">robokassa.com</a>), используемая для проведения платежей.</li>
                </ul>
              </div>
            </Section>

            <Section num="2" title="Предмет договора">
              <P>
                2.1. По настоящему договору Исполнитель обязуется предоставить Пользователю доступ к
                функциям Сайта в соответствии с выбранным тарифным планом, а Пользователь обязуется
                принять и оплатить Услугу в порядке, предусмотренном настоящей Офертой.
              </P>
              <P>
                2.2. Услуга оказывается дистанционно посредством сети «Интернет». Результатом оказания
                Услуги является предоставление Пользователю доступа к соответствующим разделам Сайта
                в течение оплаченного периода.
              </P>
              <P>
                2.3. Акцепт Оферты выражается в совершении конклюдентных действий, в том числе:
              </P>
              <ul className="list-disc pl-5 space-y-1">
                <li>регистрации учётной записи на Сайте;</li>
                <li>выбора тарифного плана и оформления заказа;</li>
                <li>оплаты выбранного тарифного плана;</li>
                <li>проставления отметки о согласии с условиями Оферты.</li>
              </ul>
            </Section>

            <Section num="3" title="Тарифные планы и стоимость Услуги">
              <P>
                3.1. На момент публикации настоящей Оферты действуют следующие тарифные планы:
              </P>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-primary/10 text-foreground">
                      <th className="px-4 py-2.5 text-left font-semibold">Тариф</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Стоимость</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Период</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">Free</td>
                      <td className="px-4 py-2.5">Бесплатно</td>
                      <td className="px-4 py-2.5">Бессрочно</td>
                    </tr>
                    <tr className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">Day Pass</td>
                      <td className="px-4 py-2.5">99 ₽</td>
                      <td className="px-4 py-2.5">24 часа</td>
                    </tr>
                    <tr className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">Legendary</td>
                      <td className="px-4 py-2.5">199 ₽</td>
                      <td className="px-4 py-2.5">1 месяц</td>
                    </tr>
                    <tr className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">Legendary</td>
                      <td className="px-4 py-2.5">349 ₽</td>
                      <td className="px-4 py-2.5">3 месяца</td>
                    </tr>
                    <tr className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">Legendary</td>
                      <td className="px-4 py-2.5">899 ₽</td>
                      <td className="px-4 py-2.5">12 месяцев (год)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <P>
                3.2. Исполнитель вправе изменять тарифы, уведомляя об этом путём публикации
                актуальной версии Оферты на Сайте. Изменение тарифов не распространяется на
                уже оплаченные периоды.
              </P>
              <P>
                3.3. Оплата производится через платёжную систему Robokassa. Принимаются банковские
                карты Visa, Mastercard, МИР, а также иные способы оплаты, доступные в Robokassa.
                Все расчёты ведутся в рублях Российской Федерации.
              </P>
            </Section>

            <Section num="4" title="Порядок предоставления доступа">
              <P>
                4.1. Доступ к функциям выбранного тарифного плана предоставляется автоматически
                сразу после подтверждения оплаты от платёжной системы Robokassa — как правило,
                в течение нескольких минут с момента оплаты.
              </P>
              <P>
                4.2. Факт предоставления доступа фиксируется в Личном кабинете Пользователя.
                Пользователь считается получившим Услугу с момента активации соответствующего
                тарифного плана в Личном кабинете.
              </P>
              <P>
                4.3. В случае технических сбоев, препятствующих автоматическому открытию доступа,
                Пользователь вправе обратиться в службу поддержки по адресу{" "}
                <a href="mailto:kikus.banhelper@gmail.com" className="text-primary hover:underline">
                  kikus.banhelper@gmail.com
                </a>.
              </P>
            </Section>

            <Section num="5" title="Права и обязанности сторон">
              <P>5.1. Исполнитель обязуется:</P>
              <ul className="list-disc pl-5 space-y-1">
                <li>обеспечивать работоспособность Сайта не менее 95% времени в месяц;</li>
                <li>предоставлять Пользователю доступ к оплаченным функциям в течение срока действия тарифного плана;</li>
                <li>обеспечивать конфиденциальность персональных данных Пользователя в соответствии с Федеральным законом № 152-ФЗ;</li>
                <li>информировать Пользователя об изменениях условий Оферты путём публикации актуальной версии на Сайте.</li>
              </ul>
              <P>5.2. Исполнитель вправе:</P>
              <ul className="list-disc pl-5 space-y-1">
                <li>проводить технические работы, уведомляя Пользователей заблаговременно;</li>
                <li>отказать в предоставлении доступа в случае нарушения Пользователем условий настоящей Оферты.</li>
              </ul>
              <P>5.3. Пользователь обязуется:</P>
              <ul className="list-disc pl-5 space-y-1">
                <li>использовать Сайт исключительно в личных, некоммерческих целях, если иное не согласовано с Исполнителем;</li>
                <li>не передавать данные своей учётной записи третьим лицам;</li>
                <li>предоставлять достоверную информацию при регистрации и оформлении заказа;</li>
                <li>оплачивать выбранный тарифный план в порядке и сроки, установленные Офертой.</li>
              </ul>
            </Section>

            <Section num="6" title="Условия возврата денежных средств">
              <P>
                6.1. Настоящая Услуга является цифровой услугой, предоставляемой в электронной
                форме. В соответствии со ст. 26.1 Закона РФ от 07.02.1992 № 2300-1
                «О защите прав потребителей» возврат денежных средств регулируется следующим образом:
              </P>
              <P>
                6.2. <span className="font-medium text-foreground">До момента активации доступа:</span> Пользователь
                вправе отказаться от Услуги и потребовать возврата уплаченных денежных средств в полном
                объёме. Под «моментом активации» понимается открытие доступа к функциям тарифного
                плана в Личном кабинете Пользователя.
              </P>
              <P>
                6.3. <span className="font-medium text-foreground">После активации доступа:</span> поскольку
                Услуга является цифровым контентом, исполнение которого началось с согласия Пользователя,
                возврат денежных средств не производится, за исключением случаев, когда Исполнителем
                не был обеспечен доступ к оплаченным функциям по причинам, зависящим от Исполнителя.
              </P>
              <P>
                6.4. Для оформления возврата Пользователь направляет заявку на адрес{" "}
                <a href="mailto:kikus.banhelper@gmail.com" className="text-primary hover:underline">
                  kikus.banhelper@gmail.com
                </a>{" "}
                с указанием адреса электронной почты, использованного при регистрации, и описанием
                причины возврата. Заявка рассматривается в течение 10 (десяти) рабочих дней.
              </P>
            </Section>

            <Section num="7" title="Конфиденциальность и персональные данные">
              <P>
                7.1. При исполнении настоящего договора Стороны обеспечивают конфиденциальность
                и безопасность персональных данных в соответствии с ФЗ от 27.07.2006 г. № 152-ФЗ
                «О персональных данных» и ФЗ от 27.07.2006 г. № 149-ФЗ «Об информации,
                информационных технологиях и о защите информации».
              </P>
              <P>
                7.2. Исполнитель обрабатывает персональные данные Пользователя (адрес электронной
                почты, данные о сессии) исключительно в целях оказания Услуги и не передаёт их
                третьим лицам, за исключением платёжной системы Robokassa в целях проведения
                расчётов.
              </P>
            </Section>

            <Section num="8" title="Форс-мажор">
              <P>
                8.1. Стороны освобождаются от ответственности за неисполнение или ненадлежащее
                исполнение обязательств, если таковое стало следствием обстоятельств непреодолимой
                силы (запретные действия властей, эпидемии, стихийные бедствия, сбои инфраструктуры
                интернета и иные чрезвычайные обстоятельства).
              </P>
              <P>
                8.2. Сторона, для которой наступили обстоятельства непреодолимой силы, обязана
                уведомить другую Сторону в течение 30 (тридцати) календарных дней.
              </P>
            </Section>

            <Section num="9" title="Ответственность сторон">
              <P>
                9.1. В случае неисполнения или ненадлежащего исполнения обязательств Стороны несут
                ответственность в соответствии с законодательством Российской Федерации.
              </P>
              <P>
                9.2. Совокупная ответственность Исполнителя перед Пользователем ограничивается
                суммой фактически оплаченного Пользователем тарифного плана.
              </P>
              <P>
                9.3. Исполнитель не несёт ответственности за результаты, полученные Пользователем
                при использовании Сервиса (в том числе за результаты турнирных игр).
              </P>
            </Section>

            <Section num="10" title="Срок действия оферты">
              <P>
                10.1. Настоящая Оферта вступает в силу с момента её размещения на Сайте и действует
                до момента её отзыва Исполнителем.
              </P>
              <P>
                10.2. Исполнитель вправе в одностороннем порядке изменить условия Оферты, опубликовав
                актуальную редакцию на Сайте. Продолжение использования Сайта после публикации
                изменений означает согласие Пользователя с новыми условиями.
              </P>
              <P>
                10.3. Договор, заключённый на основании акцепта Оферты, действует до истечения
                оплаченного периода тарифного плана либо до момента его расторжения Сторонами.
              </P>
            </Section>

            <Section num="11" title="Разрешение споров">
              <P>
                11.1. Все споры и разногласия Стороны обязуются урегулировать в досудебном порядке
                путём переговоров. Претензия направляется другой Стороне в письменной форме (в том
                числе по электронной почте) и рассматривается в течение 30 (тридцати) календарных дней.
              </P>
              <P>
                11.2. В случае недостижения согласия спор разрешается в суде по месту нахождения
                Исполнителя в соответствии с законодательством Российской Федерации.
              </P>
              <P>
                11.3. Языком договора и взаимодействия Сторон является русский язык.
              </P>
            </Section>

            <Section num="12" title="Реквизиты Исполнителя">
              <div className="bg-secondary/50 rounded-xl p-4 space-y-1.5">
                <p><span className="text-foreground font-medium">Наименование:</span> Самозанятый Сурков К.В.</p>
                <p><span className="text-foreground font-medium">ИНН:</span> 026413639226</p>
                <p><span className="text-foreground font-medium">Город:</span> г. Нефтекамск</p>
                <p>
                  <span className="text-foreground font-medium">Контактный телефон:</span>{" "}
                  <a href="tel:+79962168957" className="text-primary hover:underline">+7 996 216-89-57</a>
                </p>
                <p>
                  <span className="text-foreground font-medium">Контактный e-mail:</span>{" "}
                  <a href="mailto:kikus.banhelper@gmail.com" className="text-primary hover:underline">
                    kikus.banhelper@gmail.com
                  </a>
                </p>
                <p>
                  <span className="text-foreground font-medium">Сайт:</span>{" "}
                  <a href="https://hs-banhelper.online" className="text-primary hover:underline">
                    hs-banhelper.online
                  </a>
                </p>
              </div>
            </Section>

          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicOffer;

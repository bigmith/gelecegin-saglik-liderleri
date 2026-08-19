/**
 * Geleceğin Dijital Sağlık Liderleri
 * 3 Haftalık Eğitim & Uygulama Programı Statik Verisi ve Görev Şablonları
 * Güncel müfredat PDF'i (CURRICULUM-UPDATE-PDF-02) ile birebir senkronize edilmiştir.
 */

export const PROGRAM_SUMMARY = {
  totalWeeks: 3,
  totalDays: 6,
  totalSessions: 18,
  totalTasks: 3
}

export const PROGRAM_TASKS = [
  {
    taskKey: 'week1-antibiyotik-cift-versiyon',
    taskTitle: 'Çift Versiyonlu Antibiyotik İçeriği',
    taskWeek: 1,
    taskType: 'saha_gorevi',
    typeLabel: 'Haftanın Saha Görevi',
    taskDescription: 'Katılımcılar haftanın sağlık konusu olan antibiyotik direncini iki farklı hedef kitle için yazar:\n• Versiyon 1: Eğitimli kitle için veri, bilimsel mekanizma ve yüksek bilgi yoğunluğu.\n• Versiyon 2: Yaşlı/ortaokul kitlesi için günlük dil, kısa cümleler ve hikayeleştirme.\n\nTeslimde iki versiyonun yazılı hali teslim edilir ve biri videoya çekilir. Görev sonuna şu not eklenir: "Hangi kitlede, hangi kelimeyi/örneği neden değiştirdim?"',
    deliverableHint: 'İki versiyonun yazılı hali + birinin videosu (veya video linki) + kitle/kelime değişim gerekçesi notu.',
    evaluationHint: 'Çift hedef kitle ayrımı, dil ve terminoloji adaptasyonu, TİTCK/mevzuat uyumu ve değişim gerekçesi analizi.',
  },
  {
    taskKey: 'week2-hook-ai-senaryo',
    taskTitle: 'Bilimsel Bilgiden Yayına Hazır İçeriğe',
    taskWeek: 2,
    taskType: 'saha_gorevi',
    typeLabel: 'Haftanın Saha Görevi',
    taskDescription: 'Katılımcı sırasıyla:\n1. Bir bilimsel kaynak seçer ve kaynaktan kullanacağı 2–3 temel bilgiyi kendisi belirleyerek doğruluğunu kontrol eder.\n2. Aynı konu için 5 farklı hook yazar ve birini seçerek PAS yapısında kısa senaryo oluşturur.\n3. AI’dan alternatif senaryo ister ve AI çıktısındaki olası hata, ekleme, anlam kayması ve aşırı kesinlikleri kontrol eder.\n4. Senaryoyu hedef kitleye göre düzenler ve iletişim amacına uygun CTA ekler.\n5. Bilginin yapısına en uygun görsel formatı seçerek görselini oluşturur.',
    deliverableHint: 'Bilimsel kaynak + seçilen bilgiler + 5 hook + AI çıktısı + AI hata kontrol raporu + final senaryo + görsel.',
    evaluationHint: 'Bilimsel kaynak seçimi ve doğruluk, 5 hook yaratıcılığı ve PAS kurgusu, AI denetimi/hata raporu kalitesi, CTA etkinliği ve görsel format uyumu.',
  },
  {
    taskKey: 'week3-who-sandvic-final',
    taskTitle: 'Bilimsel İçeriği Kamera Önünde Sunma ve Kişiselleştirilmiş Kriz Yönetimi',
    taskWeek: 3,
    taskType: 'final_gorevi',
    typeLabel: 'Final Görevi',
    taskDescription: 'Katılımcı, ikinci haftada oluşturduğu bilimsel içerik senaryosu üzerinden final videosunu hazırlar.\n\nVideo kriterleri: 30–60 sn, dikey format, hedef kitleye uygun, güçlü ancak yanıltıcı olmayan giriş, bilimsel doğruluk, sade anlatım, uygun CTA ve doğal kamera kullanımı. İçerik yanlış bilgiyi düzeltmeye uygunsa Truth Sandwich yaklaşımı önerilir.\n\nKişiselleştirilmiş kriz simülasyonu: Eğitmen, katılımcının videosundaki söylem üzerinden o içeriğe özgü bir kriz/itiraz yorumu üretir; katılımcıdan buna profesyonel bir yanıt oluşturması istenir.',
    deliverableHint: '1. Final videosu + 2. Video senaryosu + 3. Kullanılan bilimsel kaynak + 4. Kişiselleştirilmiş kriz yorumuna verilen profesyonel yanıt + 5. Kısa öz değerlendirme notu.',
    evaluationHint: 'Kamera önü beden dili ve hitabet, bilimsel anlatım sadeliği, Truth Sandwich / PAS yapısı, kriz yanıtının profesyonelliği ve öz değerlendirme analizi.',
  }
]

export function getProgramTaskByKey(taskKey) {
  return PROGRAM_TASKS.find(t => t.taskKey === taskKey) || null
}

export const PROGRAM_WEEKS = [
  {
    week: 1,
    title: 'Hedef Kitleyi Tanıma ve Temel İnşası',
    goal: 'Katılımcının içerik üretmeye başlamadan önce hedef kitlesini tanıması, davranışların altındaki kök nedenleri anlaması ve aynı sağlık bilgisini, özellikle antibiyotik direncini, farklı kitlelere uyarlayabilmesidir.',
    format: [
      'Bölüm 1 (15–20 dk): Konsept Açılışı ve Stratejik Yorumlama.',
      'Küçük Ara (10 dk)',
      'Bölüm 2 ve 3 (İki adet 30\'ar dk): Derinlemesine Eğitim ve Uygulamalı Atölye.'
    ],
    days: [
      {
        dayName: 'Salı',
        title: 'Tamamen Hedef Kitle ve Davranış Günü',
        sessions: [
          {
            sessionNumber: 1,
            title: 'Hedef Kitleyi Okumak ve Kitleye Özel Mesaj Tasarımı',
            duration: '15–20 dk',
            description: 'Hedef kitle kavramının temelleri ve hedef kitle ile persona arasındaki fark ele alınır. Hedef kitlenin bilgi düzeyi ve yaşam biçiminin iletişim stratejisini nasıl değiştirdiği incelenir. Aynı sağlık bilgisinin bir tıp öğrencisine ve 70 yaşındaki bir hastaya nasıl farklı biçimlerde aktarılabileceği üzerinden uygulama yapılır.'
          },
          {
            sessionNumber: 2,
            title: 'Hedef Kitle Personası Tasarımı ve Uygulama',
            duration: '30 dk',
            description: 'Hedef kitleyi daha ayrıntılı tanımlayabilmek amacıyla iki farklı persona oluşturulur: eğitimli ve kanıt arayan bir hedef kitle ile yaşlı ve pratik çözüm arayan bir hedef kitle. Uygulama olarak katılımcılara verilen 10 problemli metin, bu iki hedef kitlenin bilgi düzeyi ve iletişim ihtiyaçlarına uygun şekilde yeniden yazılır.'
          },
          {
            sessionNumber: 3,
            title: 'Hedef Kitlenin Davranışlarını ve Beklentilerini Anlamak',
            duration: '30 dk',
            description: 'Hedef kitlenin belirli bir davranışı neden gösterdiği incelenir. Örneğin “İki güne ayağa kalkmam lazım” diyen bir hastanın beklentisinin altında bulunabilecek zaman baskısı, işe dönme zorunluluğu veya kaygı analiz edilir. Amaç hedef kitleyi yargılamak yerine davranışın altında yatan ihtiyaçları ve motivasyonları anlayarak uygun iletişim dili geliştirmektir.'
          }
        ]
      },
      {
        dayName: 'Perşembe',
        title: '2 Sosyal Medya + 1 Sağlık Günü',
        sessions: [
          {
            sessionNumber: 1,
            title: '[Sosyal Medya] Sağlık Alanında İçerik Üreticisi Olmanın Temelleri',
            duration: '15–20 dk',
            description: 'Dijital dünyada güvenilir mesleki kimlik inşası. Sosyal medyaya yeni adım atan bir sağlık profesyonelinin neleri yapması ve kesinlikle yapmaması gerektiği.'
          },
          {
            sessionNumber: 2,
            title: '[Sağlık] Türkiye’de ve Dünyada Antibiyotik Direnci (Konuk: Resul Bey)',
            duration: '30 dk',
            guest: 'Resul Bey',
            description: 'Haftanın temel sağlık oturumu. Dünyada ve Türkiye’de antibiyotik direnci gündemi, sahadaki yanlış söylemler, toplum beklentileri ve mücadele süreçleri.'
          },
          {
            sessionNumber: 3,
            title: '[Sosyal Medya] Sağlık İçeriği Üretirken Dijital Riskler: Mevzuat, Etik ve Yapay Zekâ',
            duration: '30 dk',
            description: 'Kendi ürettiğimiz içeriklerde ilgili mesleki etik ve reklam kurallarına uyum. Uygulama olarak yapay zekanın ürettiği uydurma bilgileri ve bağlam hatalarını 3 örnek metin üzerinden bulup filtreleme pratiği.'
          }
        ]
      }
    ],
    fieldTask: {
      ...PROGRAM_TASKS[0],
      type: PROGRAM_TASKS[0].typeLabel,
      title: PROGRAM_TASKS[0].taskTitle,
      description: PROGRAM_TASKS[0].taskDescription
    }
  },
  {
    week: 2,
    title: 'Bilgiyi Derinleştirme ve Dijital Araçlar',
    goal: 'Katılımcının bilimsel kaynakları okuyup değerlendirebilmesini, sağlık bilgisini yanlış bilgiden ayırabilmesini ve kendi seçtiği doğru bilgiyi sosyal medya ve yapay zekâ araçlarıyla etkili bir içeriğe dönüştürebilmesini sağlamak.',
    format: [
      'Bölüm 1 (15–20 dk): Konsept Açılışı ve Stratejik Yorumlama.',
      'Küçük Ara (10 dk)',
      'Bölüm 2 ve 3 (İki adet 30\'ar dk): Derinlemesine Eğitim ve Uygulamalı Atölye.'
    ],
    days: [
      {
        dayName: 'Salı',
        title: '2 Sağlık + 1 Teknik',
        sessions: [
          {
            sessionNumber: 1,
            title: '[Sağlık] Bilimsel Bilgiyi Okumak ve Süzmek',
            duration: '15–20 dk',
            description: 'Makale, kılavuz veya bilimsel veri nasıl okunur? Ana araştırma sorusu, temel bulgu, kanıtın gücü ve sınırlılıklar nasıl belirlenir? Katılımcıya bir bilimsel kaynaktan içerik üretmek için gerçekten hangi bilgilerin seçilmesi gerektiği uygulamalı olarak öğretilir: ana soruyu bulma, sonucu değerlendirme ve halkın bilmesi gereken bilgiyi ayırma.'
          },
          {
            sessionNumber: 2,
            title: '[Sağlık] Yanlış Sağlık Bilgisini Anlamak ve Gerçeği Güçlendirmek',
            duration: '30 dk',
            description: 'Yanlış sağlık bilgilerinin neden ikna edici olabildiği ve insanların bu bilgilere neden direnebildiği incelenir. WHO’nun Truth Sandwich yaklaşımı üzerinden, doğru bilgiyi önceleyen, yanlış iddiayı kısa ve kontrollü biçimde ele alan ve ardından doğru bilgiyi yeniden güçlendiren sağlık iletişimi örnekleri üzerinde uygulama yapılır.'
          },
          {
            sessionNumber: 3,
            title: '[Teknik] Sağlık Bilgisini İçerik Taslağına Dönüştürme',
            duration: '30 dk',
            description: 'Katılımcı seçtiği bilimsel kaynaktan kullanacağı temel bilgileri önce kendisi belirler. Daha sonra bu bilgileri yapay zekâ desteğiyle hedef kitlenin anlayabileceği bir içerik taslağına dönüştürür. AI tarafından yapılan sadeleştirmeler, eklemeler, kaynaklar ve olası anlam kaymaları ayrıca kontrol edilir. Yapay zekâ karar verici değil, üretim sürecini hızlandıran araç olarak kullanılır.'
          }
        ]
      },
      {
        dayName: 'Perşembe',
        title: '1 Sosyal Medya + 2 Teknik',
        sessions: [
          {
            sessionNumber: 1,
            title: '[Sosyal Medya] İlk 3 Saniye, Hook ve PAS',
            duration: '15–20 dk',
            description: 'Hedef kitleye uygun güçlü giriş cümlesi oluşturma, Problem–Acı–Çözüm yapısını kullanma ve sağlık bilgisini korku yaratmadan ilgi çekici hale getirme. PAS yapısının manipülasyon için değil, mesajı daha anlaşılır bir sıraya koymak için kullanılması üzerinde durulur.'
          },
          {
            sessionNumber: 2,
            title: '[Teknik] Hook ve Senaryo Üretimi (YZ Denetimi)',
            duration: '30 dk',
            description: 'Katılımcı aynı bilimsel konu için 5 farklı hook oluşturur. AI’dan alternatifler alınır ve bu alternatifler bilimsel doğruluk, fazla kesinlik, yanlış beklenti yaratma ve hedef kitle uyumu açısından değerlendirilir. AI çıktısındaki olası bilgi eklemeleri, anlam kaymaları ve hatalar tespit edilir. Ardından iletişim amacına uygun bir CTA ile kısa senaryo oluşturulur.'
          },
          {
            sessionNumber: 3,
            title: '[Teknik] Sağlık Bilgisini Görselleştirme',
            duration: '30 dk',
            description: 'Sağlık bilgisinin daha anlaşılır aktarılması için hangi bilginin hangi görsel yapıya uygun olduğu ele alınır. Sayısal veriler, karşılaştırmalar, süreçler ve karmaşık ilişkiler için tablo, grafik, akış şeması veya basit diyagram gibi anlatım biçimleri karşılaştırılır. Katılımcı seçtiği sağlık bilgisinin yapısına uygun görsel formatı belirler ve Canva gibi bir araçla uygulamaya dönüştürür.'
          }
        ]
      }
    ],
    fieldTask: {
      ...PROGRAM_TASKS[1],
      type: PROGRAM_TASKS[1].typeLabel,
      title: PROGRAM_TASKS[1].taskTitle,
      description: PROGRAM_TASKS[1].taskDescription
    }
  },
  {
    week: 3,
    title: 'Sahne, İtibar ve Kriz Yönetimi',
    goal: 'Katılımcının ikinci haftada hazırladığı bilimsel içeriği kamera önünde doğal ve güven veren biçimde sunabilmesini; içerik yayınlandıktan sonra ortaya çıkabilecek eleştiri, yanlış bilgi ve dijital itibar sorunlarını profesyonel biçimde yönetebilmesini ve içerik üretimini sürdürülebilir bir çalışma düzenine dönüştürmesini sağlamak.',
    format: [
      'Bölüm 1 (15–20 dk): Konsept Açılışı ve Stratejik Yorumlama.',
      'Küçük Ara (10 dk)',
      'Bölüm 2 ve 3 (İki adet 30\'ar dk): Derinlemesine Eğitim ve Uygulamalı Atölye.'
    ],
    days: [
      {
        dayName: 'Salı',
        title: 'Kriz, İtibar ve Sürdürülebilirlik',
        sessions: [
          {
            sessionNumber: 1,
            title: '[Sosyal Medya] Kriz Türlerini Tanımak ve Yanıt Vermek',
            duration: '15–20 dk',
            description: 'İçerik yayınlandıktan sonra gelebilecek gerçek soru, eleştiri, yanlış bilgi, provokasyon, hakaret ve kişisel saldırı gibi farklı durumların birbirinden ayrılması ele alınır. Katılımcılara gerçekçi yorum örnekleri verilerek “Cevap vermeli miyim, nasıl vermeliyim?” uygulaması yaptırılır.'
          },
          {
            sessionNumber: 2,
            title: '[Dijital İtibar] Dijital Ayak İzi Yönetimi',
            duration: '30 dk',
            description: 'Bir sağlık profesyonelinin internette bıraktığı izlerin nasıl değerlendirileceği ve yönetileceği ele alınır. Katılımcılara kendi adını arama, eski içerikleri inceleme, hatalı veya güncelliğini yitirmiş bilgileri belirleme ve farklı platformlardaki profesyonel profillerini karşılaştırma uygulaması yaptırılır.'
          },
          {
            sessionNumber: 3,
            title: '[Psikoloji] İçerik Üretiminde Sürdürülebilirlik ve Psikolojik Yük',
            duration: '30 dk',
            description: 'Yoğun mesleki hayatın üzerine sürekli içerik üretmenin getirebileceği yorum/eleştiri baskısı, sürekli çevrimiçi olma ihtiyacı ve içerik yetiştirme stresi değerlendirilir. Amaç klinik tükenmişlik tanısı koymak değil, içerik üretimini kişinin mesleki ve günlük yaşamıyla uyumlu sürdürülebilir bir çalışma düzenine dönüştürmektir.'
          }
        ]
      },
      {
        dayName: 'Perşembe',
        title: 'Sahne ve Uygulama',
        sessions: [
          {
            sessionNumber: 1,
            title: '[Sahne] Kamera Önü Varlığı ve Beden Dili',
            duration: '15–20 dk',
            description: 'Kamera ile göz teması, kadraj, eller ve mimikler, oturuş ve duruş ile otorite ve empati dengesi ele alınır. Prompter kullanırken metne bağımlı kalmadan doğal konuşma akışı oluşturma üzerinde durulur.'
          },
          {
            sessionNumber: 2,
            title: '[Sahne] Diksiyon, Vurgu, Telaffuz ve Doğal Anlatım',
            duration: '30 dk',
            description: 'Nefes kontrolü, konuşma temposu, anahtar kelimeleri vurgulama, tıbbi terimleri anlaşılır biçimde telaffuz etme ve akademik monotonluğu azaltma üzerinde çalışılır. Katılımcılar ikinci haftada hazırladıkları içeriklerden kısa bölümleri önce metne bakarak, ardından metne bakmadan aynı anlamı koruyarak anlatır.'
          },
          {
            sessionNumber: 3,
            title: '[Uygulama] Canlı Hitabet Pratiği ve Kamp Kapanışı',
            duration: '30 dk',
            description: 'Gönüllü dört katılımcı, ikinci haftada hazırladıkları bilimsel içerikleri sınıf karşısında sunar. Eğitmen hedef kitleye uygunluk, bilimsel anlatım, diksiyon, vurgu, beden dili ve doğallık kriterleri üzerinden canlı değerlendirme yapar. Diğer katılımcılar bu örnekler üzerinden ortak çıkarımlar yapar. Bireysel video değerlendirmeleri final teslimleri üzerinden gerçekleştirilir.'
          }
        ]
      }
    ],
    fieldTask: {
      ...PROGRAM_TASKS[2],
      type: PROGRAM_TASKS[2].typeLabel,
      title: PROGRAM_TASKS[2].taskTitle,
      description: PROGRAM_TASKS[2].taskDescription
    }
  }
]

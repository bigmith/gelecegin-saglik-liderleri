/**
 * Geleceğin Dijital Sağlık Liderleri
 * 3 Haftalık Eğitim & Uygulama Programı Statik Verisi ve Görev Şablonları
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
    taskTitle: 'Çift Versiyonlu Antibiyotik Senaryosu',
    taskWeek: 1,
    taskType: 'saha_gorevi',
    typeLabel: 'Haftanın Saha Görevi',
    taskDescription: 'Antibiyotik direncini iki farklı kitle için yaz. Versiyon 1: Eğitimli kesime, veri ve otorite odaklı. Versiyon 2: Ortaokul-lise ve yaşlı kesime, jargonsuz, samimi ve hikayesel. Katılımcı istediği versiyonu çekip paylaşmakta özgürdür.',
    deliverableHint: 'Bir senaryo metni veya video teslimi.',
    evaluationHint: 'Hedef kitle uyumu, dil sadeliği, TİTCK uyumu ve anlatım netliği.',
  },
  {
    taskKey: 'week2-hook-ai-senaryo',
    taskTitle: 'Etkileşim Odaklı Kanca ve Yapay Zeka Senaryosu',
    taskWeek: 2,
    taskType: 'saha_gorevi',
    typeLabel: 'Haftanın Saha Görevi',
    taskDescription: 'İzleyiciyi ilk üç saniyede yakalayacak, etik kurallara uygun beş farklı yaratıcı giriş cümlesi yaz. Bu kancaları yapay zekaya vererek kendi üslubuna uygun bir taslak senaryo oluştur. Videonun sonuna izleyiciyi yoruma, kaydetmeye veya DM’den mesaj atmaya yönlendirecek güçlü bir eylem çağrısı ekle.',
    deliverableHint: '5 hook, AI destekli senaryo taslağı ve CTA metni.',
    evaluationHint: 'Kanca gücü, etik uyum, hedef kitleye uygunluk ve CTA netliği.',
  },
  {
    taskKey: 'week3-who-sandvic-final',
    taskTitle: 'WHO Sandviç Metodu ile Sağlık Miti Videosu',
    taskWeek: 3,
    taskType: 'final_gorevi',
    typeLabel: 'Final Görevi',
    taskDescription: 'Yaygın bir sağlık mitini, örneğin antibiyotiklerle ilgili bir miti, seçip Dünya Sağlık Örgütünün sandviç metoduna uygun şekilde altmış saniyelik dikey video hazırla ve kameraya çek.',
    deliverableHint: '60 saniyelik dikey video.',
    evaluationHint: 'Yanlış bilgiyle mücadele, WHO sandviç metoduna uyum, kamera anlatımı ve güven veren dil.',
  }
]

export function getProgramTaskByKey(taskKey) {
  return PROGRAM_TASKS.find(t => t.taskKey === taskKey) || null
}

export const PROGRAM_WEEKS = [
  {
    week: 1,
    title: 'Hedef Kitle Mimarisi, Akılcı Antibiyotik Kullanımı ve Yasal Sınırlar',
    goal: 'Tıbbi bilgiyi herkesin anlayacağı kadar sadeleştirirken, hukuki ve etik mayınlara basmadan içerik üretme kaslarını geliştirmek. Hedef kitle segmentasyonunu kavramak ve antibiyotik direncini farklı kitlelere uyarlamak.',
    format: [
      'Bölüm 1 (15-20 dk): Konsept Açılışı ve Stratejik Yorumlama.',
      'Küçük Ara (10 dk)',
      'Bölüm 2 ve 3 (İki adet 30’ar dk): Derinlemesine Eğitim ve Uygulamalı Atölye.'
    ],
    days: [
      {
        dayName: 'Salı',
        title: 'Popüler Kültür, Hedef Kitle ve Diksiyon',
        sessions: [
          {
            sessionNumber: 1,
            title: 'Popüler Kültür Endüstrisi ve Sağlık Algısı',
            duration: '15-20 dk',
            description: 'Sağlık alanında değil, genel olarak popüler kültür endüstrisinin kitleleri nasıl yönlendirdiği; hızlı tüketim kültürünün insanların sağlık kararlarını ve “antibiyotik hemen iyileştirsin” beklentisini nasıl manipüle ettiği.'
          },
          {
            sessionNumber: 2,
            title: 'Hedef Kitle Analizi ve Çift Hedef Kitle Mimarisi',
            duration: '30 dk',
            description: 'Hedef kitle nedir ve nokta atışı nasıl belirlenir? Aynı tıbbi gerçeğin, örneğin antibiyotik direncinin, farklı demografilere nasıl uyarlandığı. Tıbbi jargonu rafa kaldırıp dili doğrudan ortaokul seviyesine indirme taktikleri. Bu oturum “Kitleyi belirledik, peki onlara nasıl sesleneceğiz?” geçişiyle bir sonraki oturuma bağlanır.'
          },
          {
            sessionNumber: 3,
            title: 'Diksiyon ve Kamera Önü Hitabeti',
            duration: '30 dk',
            description: 'Belirlenen kitleye uygun sesleniş biçimleri. Akademik monotoniyi kırmak; vurgu, tonlama, nefes kontrolü ve kelimeleri yutmadan güven veren bir diksiyonla hitap etme teknikleri.'
          }
        ]
      },
      {
        dayName: 'Perşembe',
        title: 'Antibiyotik Direnci, Yasal Sınırlar ve Uygulama',
        sessions: [
          {
            sessionNumber: 1,
            title: 'Yasal Kırmızı Çizgiler',
            duration: '15-20 dk',
            description: 'Türk Tabipleri Birliği disiplin kuralları ve reklam yasakları. Antibiyotik gibi reçeteli ilaçları konuşurken TİTCK kuralları kapsamında dikkat edilmesi gereken noktalar.'
          },
          {
            sessionNumber: 2,
            title: 'Türkiye’de ve Dünyada Antibiyotik Direnci',
            duration: '30 dk',
            guest: 'Resul Bey',
            description: 'Resul Bey’in sunumuyla antibiyotik direnci gündemi; dünyadaki ve Türkiye’deki mücadele süreçleri, sahada karşılaşılan söylemler ve regülasyonlar.'
          },
          {
            sessionNumber: 3,
            title: 'Canlı Vaka ve Hitabet Atölyesi',
            duration: '30 dk',
            description: 'Eğitmenlerin derse önceden getirdiği, yasal ihlaller ve zor telaffuz edilen tıbbi jargon içeren 3 adet kötü metin üzerinden canlı çalışma yapılır. Katılımcılar bu metinleri TİTCK kurallarına göre temizler ve ardından diksiyon/vurgu tekniklerini kullanarak yüksek sesle, kameraya konuşur gibi okur.'
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
    title: 'Platform Kuralları ve Yapay Zeka Hızı',
    goal: 'Sosyal medya algoritmalarını çözüp izleyiciyi ilk saniyelerde ekrana kilitleyen giriş cümleleri oluşturmayı ve yapay zeka araçlarıyla içerik üretim hızını katlamayı öğretmek.',
    format: [
      'Bölüm 1 (15-20 dk): Konsept Açılışı ve Stratejik Yorumlama.',
      'Küçük Ara (10 dk)',
      'Bölüm 2 ve 3 (İki adet 30’ar dk): Derinlemesine Eğitim ve Uygulamalı Atölye.'
    ],
    days: [
      {
        dayName: 'Salı',
        title: 'Algoritmalar, Topluluk İnşası ve Güven Dili',
        sessions: [
          {
            sessionNumber: 1,
            title: 'Güven Dili ve Nötr İletişim',
            duration: '15-20 dk',
            description: 'Sağlık mesajlarında panik veya korku yaratmadan, örneğin “antibiyotik bitiyor, öleceğiz” gibi ifadelerden kaçınarak kitlelere nasıl güven verileceği.'
          },
          {
            sessionNumber: 2,
            title: 'PAS Formülü ve İlk Üç Saniye Kuralı',
            duration: '30 dk',
            description: 'Yurtdışında bilim ve sağlık iletişiminde kullanılan PAS, yani Problem-Agitate-Solve / Problem-Acı-Çözüm kurgusu. Videolarda kritik ilk üç saniye kuralı ve izleyiciyi yakalama sanatı.'
          },
          {
            sessionNumber: 3,
            title: 'Kriz Yönetimi ve Sadık Topluluk İnşası',
            duration: '30 dk',
            description: 'Agresif trolleri krize çevirmeden topluluk yönetimiyle eritme taktikleri. Pasif takipçi yerine içeriği savunan ve etkileşimi besleyen sadık bir kemik kitle, yani superfan topluluğu oluşturmanın psikolojik ve algoritmik dinamikleri.'
          }
        ]
      },
      {
        dayName: 'Perşembe',
        title: 'Yapay Zeka Destekli Hızlı Üretim',
        sessions: [
          {
            sessionNumber: 1,
            title: 'Yapay Zeka Etiği',
            duration: '15-20 dk',
            description: 'Yapay zekanın yalnızca üretim sürecini hızlandıran bir yardımcı olarak kullanılması. Tıbbi bilgilerin doğruluğunun tamamen katılımcının bilimsel süzgecinden ve onayından geçmesi gerektiği.'
          },
          {
            sessionNumber: 2,
            title: 'Doğru Komut Yazımı',
            duration: '30 dk',
            description: 'Yapay zeka araçlarına doğru komutlar vererek sıkıcı bir klinik metni kısa sürede video senaryosuna dönüştürmek.'
          },
          {
            sessionNumber: 3,
            title: 'Görselleştirme',
            duration: '30 dk',
            description: 'Tasarım programlarıyla görsel veri tasarımlarını hazırlamak ve içerik üretim sürecini hızlandırmak.'
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
    title: 'Sahne Senin ve Dezenformasyonla Mücadele',
    goal: 'Kamera önünde doğal, akıcı ve güven veren bir ekran yüzü oluştururken, dijital krizleri profesyonelce yönetme refleksi kazandırmak.',
    format: [
      'Bölüm 1 (15-20 dk): Konsept Açılışı ve Stratejik Yorumlama.',
      'Küçük Ara (10 dk)',
      'Bölüm 2 ve 3 (İki adet 30’ar dk): Derinlemesine Eğitim ve Uygulamalı Atölye.'
    ],
    days: [
      {
        dayName: 'Salı',
        title: 'Yanlış Bilgi ile Mücadele ve İtibar Yönetimi',
        sessions: [
          {
            sessionNumber: 1,
            title: 'İnfodemi Nedir?',
            duration: '15-20 dk',
            description: 'Bilgi kirliliğinin ve kulaktan dolma sağlık mitlerinin toplum sağlığına etkileri.'
          },
          {
            sessionNumber: 2,
            title: 'WHO Sandviç Metodu',
            duration: '30 dk',
            description: 'Yanlış bilgiyi, karşı tarafı savunmaya geçirmeden ve tetiklemeden çürütme sanatı. Önce gerçeği, sonra yanlış iddiayı, ardından tekrar gerçeği anlatan sandviç metodu.'
          },
          {
            sessionNumber: 3,
            title: 'İtibar, Dijital Ayak İzi ve Tükenmişlik',
            duration: '30 dk',
            description: 'Sadece kriz anında trollere cevap vermek değil; geçmişteki hatalı paylaşımların dijitalden nasıl temizleneceği ve sosyal medyada içerik üretirken oluşan psikolojik tükenmişlikten korunma yolları.'
          }
        ]
      },
      {
        dayName: 'Perşembe',
        title: 'Kamera Önü Sunum ve Doğaçlama',
        sessions: [
          {
            sessionNumber: 1,
            title: 'Beden Dili ve Otorite',
            duration: '15-20 dk',
            description: 'Kamerayla göz teması kurma, beden dilini ayarlama ve otorite ile empati dengesini sağlama.'
          },
          {
            sessionNumber: 2,
            title: 'Doğal Akışta Kalmak',
            duration: '30 dk',
            description: 'Prompter cihazı robotluğundan çıkıp doğal akışta kalabilme taktikleri.'
          },
          {
            sessionNumber: 3,
            title: 'Kamp Kapanışı ve Strateji',
            duration: '30 dk',
            description: 'Kişiye özel çıkarılan içerik stratejisi raporlarının değerlendirilmesi ve sürdürülebilir plan oluşturma.'
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

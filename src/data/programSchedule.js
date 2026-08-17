/**
 * Geleceğin Dijital Sağlık Liderleri
 * 3 Haftalık Eğitim & Uygulama Programı Statik Verisi ve Görev Şablonları
 * Güncel müfredat.pdf ile birebir senkronize edilmiştir.
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
    taskDescription: 'Antibiyotik direncini iki farklı kitle için yazmak. Versiyon 1: Eğitimli kesime (veri ve otorite odaklı). Versiyon 2: Ortaokul-Lise ve Yaşlı kesime (jargonsuz, samimi ve hikayesel). Katılımcı istediği versiyonu çekip paylaşmakta özgürdür.',
    deliverableHint: 'Senaryo metni veya çekilmiş video teslimi.',
    evaluationHint: 'Çift hedef kitle ayrımı, TİTCK kurallarına uyum, jargonsuzlaştırma ve anlatım güveni.',
  },
  {
    taskKey: 'week2-hook-ai-senaryo',
    taskTitle: 'Etkileşim Odaklı Kanca ve Yapay Zeka Senaryosu',
    taskWeek: 2,
    taskType: 'saha_gorevi',
    typeLabel: 'Haftanın Saha Görevi',
    taskDescription: 'İzleyiciyi ilk üç saniyede yakalayacak, dikkat çekici ve etik kurallara tamamen uygun beş farklı yaratıcı giriş cümlesi (hook) yazmak. Bunları yapay zekaya vererek kendi üsluplarına uygun bir taslak senaryo oluşturmak. Ardından, yeni başlayan veya deneyimli fark etmeksizin herkesin uygulayacağı şekilde; videonun sonuna izleyiciyi yoruma, kaydetmeye veya DM\'den mesaj atmaya yönlendirecek güçlü bir eylem çağrısı (CTA) kurgulayarak senaryoyu bitirmek.',
    deliverableHint: '5 yaratıcı hook, AI destekli taslak senaryo ve güçlü CTA kurgusu.',
    evaluationHint: 'İlk 3 saniye kanca gücü, etik ve mevzuat uyumu, üslup tutarlılığı ve CTA etkinliği.',
  },
  {
    taskKey: 'week3-who-sandvic-final',
    taskTitle: 'WHO Sandviç Metodu ile Sağlık Miti Videosu',
    taskWeek: 3,
    taskType: 'final_gorevi',
    typeLabel: 'Final Görevi',
    taskDescription: 'Yaygın bir sağlık mitini (örneğin antibiyotiklerle ilgili) seçip, Dünya Sağlık Örgütünün sandviç metoduna uygun şekilde altmış saniyelik dikey bir video hazırlamak ve kameraya çekmek.',
    deliverableHint: '60 saniyelik dikey formatta hazırlanmış video veya video linki.',
    evaluationHint: 'WHO Sandviç Metodu (Gerçek - Mit - Gerçek) kurgusu, kamera önü beden dili ve güven veren hitabet.',
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
      'Bölüm 2 ve 3 (İki adet 30\'ar dk): Derinlemesine Eğitim ve Uygulamalı Atölye.'
    ],
    days: [
      {
        dayName: 'Salı',
        title: 'Popüler Kültür, Hedef Kitle ve Diksiyon',
        sessions: [
          {
            sessionNumber: 1,
            title: 'Hedef Kitlenin Sağlık Algısı ve Popüler Kültür',
            duration: '15-20 dk',
            description: 'İçerik üreteceğimiz kitle kimlerden oluşuyor ve popüler kültür bu kitlenin sağlık kararlarını nasıl yönlendiriyor? "Hızlı tüketim" kültürünün, hedef kitlemiz üzerinde yarattığı "antibiyotik hemen iyileştirsin" şeklindeki manipülatif beklentilerini ve algılarını analiz ediyoruz.'
          },
          {
            sessionNumber: 2,
            title: 'Hedef Kitle Analizi ve Çift Hedef Kitle Mimarisi',
            duration: '30 dk',
            description: 'Hedef kitle nokta atışı nasıl belirlenir? Aynı tıbbi gerçeğin (antibiyotik direnci) farklı demografilere nasıl uyarlandığı. Tıbbi jargonu rafa kaldırıp dili doğrudan ortaokul seviyesine indirme taktikleri. (Bu aşamada "Kitleyi belirledik, peki onlara nasıl sesleneceğiz?" diyerek bir sonraki oturuma bağlanılır).'
          },
          {
            sessionNumber: 3,
            title: 'Hedef Kitleye Özel İletişim ve Hitabet',
            duration: '30 dk',
            description: 'Belirlenen kitleye uygun sesleniş biçimleri. Klasik bir diksiyon dersinden ziyade; akademik monotoniyi kırmak, vurgu, tonlama, nefes kontrolü ve kelimeleri yutmadan, direkt olarak hedef kitlenin anlayacağı ve güven duyacağı bir hitabetin teknikleri.'
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
            description: 'Masada Türk Tabipleri Birliği disiplin kuralları ve reklam yasakları var. Antibiyotik gibi reçeteli ilaçları konuşurken TİTCK kuralları kapsamında nelere dikkat edileceği.'
          },
          {
            sessionNumber: 2,
            title: 'Türkiye\'de ve Dünyada Antibiyotik Direnci (Konuk: Resul Bey)',
            duration: '30 dk',
            guest: 'Resul Bey',
            description: 'Resul Bey\'in sunumuyla antibiyotik direnci gündemi; dünyadaki ve Türkiye\'deki mücadele süreçleri, sahada karşılaşılan söylemler ve regülasyonlar.'
          },
          {
            sessionNumber: 3,
            title: 'Canlı Vaka ve Hitabet Atölyesi',
            duration: '30 dk',
            description: 'Eğitmenlerin derse önceden getirdiği, yasal ihlallerle ve zor telaffuz edilen tıbbi jargona boğulmuş 3 adet "kötü" metin üzerinden canlı çalışma yapılır. Katılımcılar sınıfta bu metinleri TİTCK kurallarına göre temizler ve ardından diksiyon/vurgu tekniklerini kullanarak yüksek sesle, kameraya konuşur gibi okur.'
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
      'Bölüm 2 ve 3 (İki adet 30\'ar dk): Derinlemesine Eğitim ve Uygulamalı Atölye.'
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
            description: 'Sağlık mesajlarında panik veya korku (örneğin "antibiyotik bitiyor, öleceğiz") yaratmadan kitlelere nasıl güven verileceği.'
          },
          {
            sessionNumber: 2,
            title: 'PAS Formülü ve İlk Üç Saniye Kuralı',
            duration: '30 dk',
            description: 'Yurtdışında bilim ve sağlık iletişiminde altın standart olan PAS (Problem-Agitate-Solve / Problem-Acı-Çözüm) kurgusunun anlatımı. Bu formülle videolardaki o kritik ilk üç saniye kuralı ve izleyiciyi yakalama sanatı.'
          },
          {
            sessionNumber: 3,
            title: 'Kriz Yönetimi ve Sadık Topluluk (Superfan) İnşası',
            duration: '30 dk',
            description: 'Agresif trolleri krize çevirmeden topluluk yönetimiyle eritme taktikleri. Ek olarak, sadece pasif takipçi değil, içeriği savunan ve etkileşimi besleyen sadık bir kemik kitle (superfan) yaratmanın psikolojik ve algoritmik dinamikleri.'
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
            description: 'Yapay zeka sadece hamalımız olup taslağı çıkaracak. Tıbbi bilgilerin doğruluğunun tamamen katılımcının bilimsel süzgecinden ve onayından geçeceği kuralı.'
          },
          {
            sessionNumber: 2,
            title: 'Doğru Komut (Prompt) Yazımı',
            duration: '30 dk',
            description: 'Yapay zeka araçlarına doğru komutlar vererek sıkıcı bir klinik metni saniyeler içinde video senaryosuna dönüştürmek.'
          },
          {
            sessionNumber: 3,
            title: 'Görselleştirme',
            duration: '30 dk',
            description: 'Ardından tasarım programlarıyla görsel veri tasarımlarını halletmek.'
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
      'Bölüm 2 ve 3 (İki adet 30\'ar dk): Derinlemesine Eğitim ve Uygulamalı Atölye.'
    ],
    days: [
      {
        dayName: 'Salı',
        title: 'Yanlış Bilgi ile Mücadele (İnfodemi) ve İtibar Yönetimi',
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
            description: 'Yanlış bilgiyi, karşı tarafı savunmaya geçirmeden ve tetiklemeden çürütme sanatı. Önce gerçeği, sonra yanlış iddiayı, ardından tekrar gerçeği anlattığımız sandviç metodu.'
          },
          {
            sessionNumber: 3,
            title: 'İtibar, Dijital Ayak İzi ve Tükenmişlik (Burnout)',
            duration: '30 dk',
            description: 'Sadece kriz anında trollere cevap vermek değil; geçmişteki hatalı paylaşımların dijitalden nasıl temizleneceği (Unutulma Hakkı) ve sosyal medyada içerik üretirken oluşan psikolojik tükenmişlikten (burnout) korunma yolları.'
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

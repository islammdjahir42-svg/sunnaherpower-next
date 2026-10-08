// বাংলাদেশের জেলা ও থানা — বাংলা label, ইংরেজি value, জেলা সদরের পোস্টকোড
// কাস্টমার শুধু বাংলা দেখে; WooCommerce-এ ইংরেজি যায়।
// ফরম্যাট: "বাংলা:English|বাংলা:English"

export type Thana = { bn: string; en: string };
export type District = { bn: string; en: string; postcode: string; thanas: Thana[] };

const RAW: [string, string, string, string][] = [
  ["ঢাকা", "Dhaka", "1000", "সাভার:Savar|ধামরাই:Dhamrai|কেরানীগঞ্জ:Keraniganj|নবাবগঞ্জ:Nawabganj|দোহার:Dohar|ঢাকা সদর:Dhaka Sadar|মিরপুর:Mirpur|গুলশান:Gulshan|তেজগাঁও:Tejgaon|মোহাম্মদপুর:Mohammadpur|লালবাগ:Lalbagh|কোতোয়ালি:Kotwali|সূত্রাপুর:Sutrapur|ডেমরা:Demra|কদমতলী:Kadamtali|শ্যামপুর:Shyampur|খিলগাঁও:Khilgaon|জোয়ার সাহারা:Joar Sahara|বাড্ডা:Badda|ভাটারা:Bhatara|রূপনগর:Rupnagar|পল্লবী:Pallabi|কাফরুল:Kafrul|ক্যান্টনমেন্ট:Cantonment|শাহজাহানপুর:Shahjahanpur|খিলখেত:Khilkhet|উত্তরখান:Uttarkhan|দক্ষিণখান:Dakshinkhan|তুরাগ:Turag"],
  ["চট্টগ্রাম", "Chattogram", "4000", "আনোয়ারা:Anwara|বাঁশখালী:Banshkhali|বোয়ালখালী:Boalkhali|চন্দনাইশ:Chandanaish|ফটিকছড়ি:Fatikchhari|হাটহাজারী:Hathazari|কর্ণফুলী:Karnaphuli|লোহাগাড়া:Lohagara|মিরসরাই:Mirsharai|পটিয়া:Patiya|রাঙ্গুনিয়া:Rangunia|রাউজান:Raozan|সন্দ্বীপ:Sandwip|সাতকানিয়া:Satkania|সীতাকুণ্ড:Sitakunda|চট্টগ্রাম সদর:Chattogram Sadar|কোতোয়ালি:Kotwali|পাঁচলাইশ:Panchlaish|বন্দর:Bandar|বায়েজিদ:Bayazid|চান্দগাঁও:Chandgaon|ডবলমুরিং:Double Mooring|ইপিজেড:EPZ|হালিশহর:Halishahar|পাহাড়তলী:Pahartali|আকবরশাহ:Akbarshah|খুলশী:Khulshi"],
  ["রাজশাহী", "Rajshahi", "6000", "বাঘা:Bagha|বাগমারা:Bagmara|চারঘাট:Charghat|দুর্গাপুর:Durgapur|গোদাগাড়ী:Godagari|মোহনপুর:Mohanpur|পবা:Paba|পুঠিয়া:Puthia|তানোর:Tanore|রাজশাহী সদর:Rajshahi Sadar|বোয়ালিয়া:Boalia|মতিহার:Motihar|রাজপাড়া:Rajpara|শাহ মখদুম:Shah Makhdum"],
  ["খুলনা", "Khulna", "9000", "বটিয়াঘাটা:Batiaghata|দাকোপ:Dacope|ডুমুরিয়া:Dumuria|ফুলতলা:Phultala|কয়রা:Koyra|পাইকগাছা:Paikgachha|রূপসা:Rupsha|তেরখাদা:Terokhada|দিঘলিয়া:Dighalia|খুলনা সদর:Khulna Sadar|খালিশপুর:Khalishpur|সোনাডাঙ্গা:Sonadanga|লবণচরা:Labanchara"],
  ["বরিশাল", "Barishal", "8200", "আগৈলঝাড়া:Agailjhara|বাকেরগঞ্জ:Bakerganj|বানারীপাড়া:Banaripara|গৌরনদী:Gournadi|হিজলা:Hizla|মেহেন্দিগঞ্জ:Mehendiganj|মুলাদী:Muladi|উজিরপুর:Wazirpur|বরিশাল সদর:Barishal Sadar|কোতোয়ালি:Kotwali|বন্দর:Bandar|কাউনিয়া:Kaunia"],
  ["সিলেট", "Sylhet", "3100", "বালাগঞ্জ:Balaganj|বিয়ানীবাজার:Beanibazar|বিশ্বনাথ:Bishwanath|কোম্পানীগঞ্জ:Companiganj|ফেঞ্চুগঞ্জ:Fenchuganj|গোলাপগঞ্জ:Golapganj|গোয়াইনঘাট:Gowainghat|জৈন্তাপুর:Jaintiapur|কানাইঘাট:Kanaighat|সিলেট সদর:Sylhet Sadar|ওসমানী নগর:Osmani Nagar|দক্ষিণ সুরমা:Dakshin Surma|জকিগঞ্জ:Zakiganj"],
  ["রংপুর", "Rangpur", "5400", "বদরগঞ্জ:Badarganj|গঙ্গাচড়া:Gangachara|কাউনিয়া:Kaunia|মিঠাপুকুর:Mithapukur|পীরগঞ্জ:Pirganj|পীরগাছা:Pirgachha|তারাগঞ্জ:Taraganj|রংপুর সদর:Rangpur Sadar|কোতোয়ালি:Kotwali|হারাগাছ:Haragachh|মাহিগঞ্জ:Mahiganj"],
  ["ময়মনসিংহ", "Mymensingh", "2200", "ভালুকা:Bhaluka|ধোবাউড়া:Dhobaura|ফুলবাড়িয়া:Fulbaria|গফরগাঁও:Gaffargaon|গৌরীপুর:Gauripur|হালুয়াঘাট:Haluaghat|ঈশ্বরগঞ্জ:Ishwarganj|মুক্তাগাছা:Muktagachha|নান্দাইল:Nandail|ফুলপুর:Phulpur|তারাকান্দা:Tarakanda|ত্রিশাল:Trishal|ময়মনসিংহ সদর:Mymensingh Sadar|কোতোয়ালি:Kotwali"],
  ["কুমিল্লা", "Cumilla", "3500", "বরুড়া:Barura|ব্রাহ্মণপাড়া:Brahmanpara|বুড়িচং:Burichang|চান্দিনা:Chandina|চৌদ্দগ্রাম:Chauddagram|দাউদকান্দি:Daudkandi|দেবিদ্বার:Debidwar|হোমনা:Homna|লাকসাম:Laksam|লালমাই:Lalmai|মেঘনা:Meghna|মনোহরগঞ্জ:Monohorganj|মুরাদনগর:Muradnagar|নাঙ্গলকোট:Nangalkot|কুমিল্লা সদর:Cumilla Sadar|তিতাস:Titas"],
  ["নোয়াখালী", "Noakhali", "3800", "বেগমগঞ্জ:Begumganj|চাটখিল:Chatkhil|কোম্পানীগঞ্জ:Companiganj|হাতিয়া:Hatiya|কবিরহাট:Kabirhat|সেনবাগ:Senbagh|সোনাইমুড়ি:Sonaimuri|সুবর্ণচর:Subarnachar|নোয়াখালী সদর:Noakhali Sadar"],
  ["ব্রাহ্মণবাড়িয়া", "Brahmanbaria", "3400", "আখাউড়া:Akhaura|বাঞ্ছারামপুর:Bancharampur|বিজয়নগর:Bijoynagar|কসবা:Kasba|নাসিরনগর:Nasirnagar|নবীনগর:Nabinagar|সরাইল:Sarail|ব্রাহ্মণবাড়িয়া সদর:Brahmanbaria Sadar"],
  ["ফরিদপুর", "Faridpur", "7800", "আলফাডাঙ্গা:Alfadanga|ভাঙ্গা:Bhanga|বোয়ালমারী:Boalmari|চরভদ্রাসন:Charbhadrasan|মধুখালী:Madhukhali|নগরকান্দা:Nagarkanda|সদরপুর:Sadarpur|সালথা:Saltha|ফরিদপুর সদর:Faridpur Sadar"],
  ["টাঙ্গাইল", "Tangail", "1900", "বাসাইল:Basail|ভুয়াপুর:Bhuapur|দেলদুয়ার:Delduar|ধনবাড়ী:Dhanbari|ঘাটাইল:Ghatail|গোপালপুর:Gopalpur|কালিহাতী:Kalihati|মধুপুর:Madhupur|মির্জাপুর:Mirzapur|নাগরপুর:Nagarpur|সখীপুর:Sakhipur|টাঙ্গাইল সদর:Tangail Sadar"],
  ["গাজীপুর", "Gazipur", "1700", "কালিয়াকৈর:Kaliakair|কালীগঞ্জ:Kaliganj|কাপাসিয়া:Kapasia|শ্রীপুর:Sreepur|গাজীপুর সদর:Gazipur Sadar|জয়দেবপুর:Joydebpur|টঙ্গী:Tongi"],
  ["নারায়ণগঞ্জ", "Narayanganj", "1400", "আড়াইহাজার:Araihazar|বন্দর:Bandar|রূপগঞ্জ:Rupganj|সোনারগাঁও:Sonargaon|নারায়ণগঞ্জ সদর:Narayanganj Sadar"],
  ["মুন্সিগঞ্জ", "Munshiganj", "1500", "গজারিয়া:Gazaria|লৌহজং:Louhajang|মুন্সিগঞ্জ সদর:Munshiganj Sadar|শ্রীনগর:Sreenagar|সিরাজদিখান:Sirajdikhan|টঙ্গিবাড়ি:Tongibari"],
  ["মানিকগঞ্জ", "Manikganj", "1800", "দৌলতপুর:Daulatpur|ঘিওর:Ghior|হরিরামপুর:Harirampur|মানিকগঞ্জ সদর:Manikganj Sadar|সাটুরিয়া:Saturia|শিবালয়:Shibalaya|সিঙ্গাইর:Singair"],
  ["কিশোরগঞ্জ", "Kishoreganj", "2300", "অষ্টগ্রাম:Austagram|বাজিতপুর:Bajitpur|ভৈরব:Bhairab|হোসেনপুর:Hossainpur|ইটনা:Itna|করিমগঞ্জ:Karimganj|কটিয়াদি:Katiadi|কুলিয়ারচর:Kuliarchar|মিঠামইন:Mithamain|নিকলি:Nikli|পাকুন্দিয়া:Pakundia|তাড়াইল:Tarail|কিশোরগঞ্জ সদর:Kishoreganj Sadar"],
  ["নেত্রকোণা", "Netrokona", "2400", "আটপাড়া:Atpara|বারহাট্টা:Barhatta|দুর্গাপুর:Durgapur|খালিয়াজুড়ি:Khaliajuri|কলমাকান্দা:Kalmakanda|কেন্দুয়া:Kendua|মদন:Madan|মোহনগঞ্জ:Mohanganj|নেত্রকোণা সদর:Netrokona Sadar|পূর্বধলা:Purbadhala"],
  ["জামালপুর", "Jamalpur", "2000", "বকশীগঞ্জ:Bakshiganj|দেওয়ানগঞ্জ:Dewanganj|ইসলামপুর:Islampur|জামালপুর সদর:Jamalpur Sadar|মাদারগঞ্জ:Madarganj|মেলান্দহ:Melandaha|সরিষাবাড়ী:Sarishabari"],
  ["শেরপুর", "Sherpur", "2100", "ঝিনাইগাতী:Jhenaigati|নকলা:Nakla|নালিতাবাড়ী:Nalitabari|শেরপুর সদর:Sherpur Sadar|শ্রীবরদী:Sreebardi"],
  ["বগুড়া", "Bogura", "5800", "আদমদীঘি:Adamdighi|বগুড়া সদর:Bogura Sadar|ধুনট:Dhunat|দুপচাঁচিয়া:Dupchanchia|গাবতলী:Gabtali|কাহালু:Kahaloo|নন্দীগ্রাম:Nandigram|শাজাহানপুর:Shajahanpur|শেরপুর:Sherpur|শিবগঞ্জ:Shibganj|সোনাতলা:Sonatala"],
  ["চাঁপাইনবাবগঞ্জ", "Chapai Nawabganj", "6300", "ভোলাহাট:Bholahat|গোমস্তাপুর:Gomastapur|নাচোল:Nachole|নবাবগঞ্জ সদর:Nawabganj Sadar|শিবগঞ্জ:Shibganj"],
  ["নওগাঁ", "Naogaon", "6500", "আত্রাই:Atrai|বদলগাছী:Badalgachhi|ধামইরহাট:Dhamoirhat|মান্দা:Manda|মহাদেবপুর:Mohadevpur|নওগাঁ সদর:Naogaon Sadar|নিয়ামতপুর:Niamatpur|পত্নীতলা:Patnitala|পোরশা:Porsha|রাণীনগর:Raninagar|সাপাহার:Sapahar"],
  ["নাটোর", "Natore", "6400", "বাগাতিপাড়া:Bagatipara|বড়াইগ্রাম:Baraigram|গুরুদাসপুর:Gurudaspur|লালপুর:Lalpur|নাটোর সদর:Natore Sadar|সিংড়া:Singra"],
  ["পাবনা", "Pabna", "6600", "আটঘরিয়া:Atgharia|বেড়া:Bera|ভাঙ্গুড়া:Bhangura|চাটমোহর:Chatmohar|ফরিদপুর:Faridpur|ঈশ্বরদী:Ishwardi|পাবনা সদর:Pabna Sadar|সাঁথিয়া:Santhia|সুজানগর:Sujanagar"],
  ["সিরাজগঞ্জ", "Sirajganj", "6700", "বেলকুচি:Belkuchi|চৌহালি:Chauhali|কামারখন্দ:Kamarkhanda|কাজীপুর:Kazipur|রায়গঞ্জ:Raiganj|শাহজাদপুর:Shahjadpur|সিরাজগঞ্জ সদর:Sirajganj Sadar|তাড়াশ:Tarash|উল্লাপাড়া:Ullapara"],
  ["যশোর", "Jashore", "7400", "অভয়নগর:Abhaynagar|বাঘারপাড়া:Bagherpara|চৌগাছা:Chaugachha|ঝিকরগাছা:Jhikargachha|কেশবপুর:Keshabpur|মণিরামপুর:Manirampur|শার্শা:Sharsha|যশোর সদর:Jashore Sadar"],
  ["সাতক্ষীরা", "Satkhira", "9400", "আশাশুনি:Assasuni|দেবহাটা:Debhata|কালিগঞ্জ:Kaliganj|কলারোয়া:Kalaroa|সাতক্ষীরা সদর:Satkhira Sadar|শ্যামনগর:Shyamnagar|তালা:Tala"],
  ["ঝিনাইদহ", "Jhenaidah", "7300", "হরিণাকুণ্ডু:Harinakunda|ঝিনাইদহ সদর:Jhenaidah Sadar|কালীগঞ্জ:Kaliganj|কোটচাঁদপুর:Kotchandpur|মহেশপুর:Maheshpur|শৈলকুপা:Shailkupa"],
  ["মাগুরা", "Magura", "7600", "মাগুরা সদর:Magura Sadar|মহম্মদপুর:Mohammadpur|শালিখা:Shalikha|শ্রীপুর:Sreepur"],
  ["নড়াইল", "Narail", "7500", "কালিয়া:Kalia|নড়াইল সদর:Narail Sadar|লোহাগড়া:Lohagara"],
  ["বাগেরহাট", "Bagerhat", "9300", "বাগেরহাট সদর:Bagerhat Sadar|চিতলমারী:Chitalmari|ফকিরহাট:Fakirhat|কচুয়া:Kachua|মংলা:Mongla|মোরেলগঞ্জ:Morrelganj|মোল্লাহাট:Mollahat|রামপাল:Rampal|শরণখোলা:Sarankhola"],
  ["মেহেরপুর", "Meherpur", "7100", "গাংনী:Gangni|মেহেরপুর সদর:Meherpur Sadar|মুজিবনগর:Mujibnagar"],
  ["চুয়াডাঙ্গা", "Chuadanga", "7200", "আলমডাঙ্গা:Alamdanga|চুয়াডাঙ্গা সদর:Chuadanga Sadar|দামুড়হুদা:Damurhuda|জীবননগর:Jibannagar"],
  ["কুষ্টিয়া", "Kushtia", "7000", "ভেড়ামারা:Bheramara|দৌলতপুর:Daulatpur|খোকসা:Khoksa|কুমারখালী:Kumarkhali|কুষ্টিয়া সদর:Kushtia Sadar|মিরপুর:Mirpur"],
  ["বরগুনা", "Barguna", "8700", "আমতলী:Amtali|বামনা:Bamna|বরগুনা সদর:Barguna Sadar|বেতাগী:Betagi|পাথরঘাটা:Patharghata|তালতলী:Taltali"],
  ["পটুয়াখালী", "Patuakhali", "8600", "বাউফল:Bauphal|দশমিনা:Dashmina|গলাচিপা:Galachipa|কলাপাড়া:Kalapara|মির্জাগঞ্জ:Mirzaganj|পটুয়াখালী সদর:Patuakhali Sadar|রাঙ্গাবালী:Rangabali"],
  ["ভোলা", "Bhola", "8300", "বোরহানউদ্দিন:Burhanuddin|চরফ্যাশন:Char Fasson|দৌলতখান:Daulatkhan|লালমোহন:Lalmohan|মনপুরা:Monpura|তজুমদ্দিন:Tazumuddin|ভোলা সদর:Bhola Sadar"],
  ["ঝালকাঠি", "Jhalokati", "8400", "কাঁঠালিয়া:Kathalia|ঝালকাঠি সদর:Jhalokati Sadar|নলছিটি:Nalchity|রাজাপুর:Rajapur"],
  ["পিরোজপুর", "Pirojpur", "8500", "ভান্ডারিয়া:Bhandaria|ইন্দুরকানি:Indurkani|কাউখালী:Kawkhali|মঠবাড়িয়া:Mathbaria|নাজিরপুর:Nazirpur|নেছারাবাদ:Nesarabad|পিরোজপুর সদর:Pirojpur Sadar"],
  ["হবিগঞ্জ", "Habiganj", "3300", "আজমিরীগঞ্জ:Ajmiriganj|বাহুবল:Bahubal|বানিয়াচং:Baniachong|চুনারুঘাট:Chunarughat|হবিগঞ্জ সদর:Habiganj Sadar|লাখাই:Lakhai|মাধবপুর:Madhabpur|নবীগঞ্জ:Nabiganj"],
  ["মৌলভীবাজার", "Moulvibazar", "3200", "বড়লেখা:Barlekha|জুড়ী:Juri|কমলগঞ্জ:Kamalganj|কুলাউড়া:Kulaura|মৌলভীবাজার সদর:Moulvibazar Sadar|রাজনগর:Rajnagar|শ্রীমঙ্গল:Sreemangal"],
  ["সুনামগঞ্জ", "Sunamganj", "3000", "বিশ্বম্ভরপুর:Bishwambharpur|ছাতক:Chhatak|দক্ষিণ সুনামগঞ্জ:Dakshin Sunamganj|দিরাই:Derai|দোয়ারাবাজার:Dowarabazar|জগন্নাথপুর:Jagannathpur|জামালগঞ্জ:Jamalganj|শাল্লা:Sulla|সুনামগঞ্জ সদর:Sunamganj Sadar|তাহিরপুর:Tahirpur"],
  ["লক্ষ্মীপুর", "Lakshmipur", "3700", "কমলনগর:Kamalnagar|লক্ষ্মীপুর সদর:Lakshmipur Sadar|রামগঞ্জ:Ramganj|রামগতি:Ramgati|রায়পুর:Raipur"],
  ["চাঁদপুর", "Chandpur", "3600", "ফরিদগঞ্জ:Faridganj|হাইমচর:Haimchar|হাজীগঞ্জ:Hajiganj|কচুয়া:Kachua|মতলব উত্তর:Matlab Uttar|মতলব দক্ষিণ:Matlab Dakshin|চাঁদপুর সদর:Chandpur Sadar|শাহরাস্তি:Shahrasti"],
  ["ফেনী", "Feni", "3900", "ছাগলনাইয়া:Chhagalnaiya|দাগনভূইঞা:Daganbhuiyan|ফেনী সদর:Feni Sadar|ফুলগাজী:Fulgazi|পরশুরাম:Parshuram|সোনাগাজী:Sonagazi"],
  ["খাগড়াছড়ি", "Khagrachhari", "4400", "দিঘীনালা:Dighinala|গুইমারা:Guimara|খাগড়াছড়ি সদর:Khagrachhari Sadar|লক্ষ্মীছড়ি:Lakshmichhari|মহালছড়ি:Mahalchhari|মানিকছড়ি:Manikchhari|মাটিরাঙ্গা:Matiranga|পানছড়ি:Panchhari|রামগড়:Ramgarh"],
  ["রাঙ্গামাটি", "Rangamati", "4500", "বাঘাইছড়ি:Baghaichhari|বরকল:Barkal|বিলাইছড়ি:Bilaichhari|কাউখালী:Kawkhali|কাপ্তাই:Kaptai|জুরাছড়ি:Jurachhari|লংগদু:Langadu|নানিয়ারচর:Naniarchar|রাজস্থলী:Rajasthali|রাঙ্গামাটি সদর:Rangamati Sadar"],
  ["বান্দরবান", "Bandarban", "4600", "আলীকদম:Alikadam|বান্দরবান সদর:Bandarban Sadar|লামা:Lama|নাইক্ষ্যংছড়ি:Naikhongchhari|রোয়াংছড়ি:Rowangchhari|রুমা:Ruma|থানচি:Thanchi"],
  ["কক্সবাজার", "Cox's Bazar", "4700", "চকরিয়া:Chakaria|কক্সবাজার সদর:Cox's Bazar Sadar|কুতুবদিয়া:Kutubdia|মহেশখালী:Maheshkhali|পেকুয়া:Pekua|রামু:Ramu|টেকনাফ:Teknaf|উখিয়া:Ukhia"],
  ["দিনাজপুর", "Dinajpur", "5200", "বিরামপুর:Birampur|বিরল:Biral|বোচাগঞ্জ:Bochaganj|চিরিরবন্দর:Chirirbandar|ফুলবাড়ী:Fulbari|ঘোড়াঘাট:Ghoraghat|হাকিমপুর:Hakimpur|খানসামা:Khansama|দিনাজপুর সদর:Dinajpur Sadar|নবাবগঞ্জ:Nawabganj|পার্বতীপুর:Parbatipur"],
  ["ঠাকুরগাঁও", "Thakurgaon", "5100", "বালিয়াডাঙ্গী:Baliadangi|হরিপুর:Haripur|পীরগঞ্জ:Pirganj|রাণীশংকৈল:Ranisankail|ঠাকুরগাঁও সদর:Thakurgaon Sadar"],
  ["পঞ্চগড়", "Panchagarh", "5000", "আটোয়ারী:Atwari|বোদা:Boda|দেবীগঞ্জ:Debiganj|পঞ্চগড় সদর:Panchagarh Sadar|তেতুলিয়া:Tetulia"],
  ["নীলফামারী", "Nilphamari", "5300", "ডিমলা:Dimla|ডোমার:Domar|জলঢাকা:Jaldhaka|কিশোরগঞ্জ:Kishoreganj|নীলফামারী সদর:Nilphamari Sadar|সৈয়দপুর:Saidpur"],
  ["গাইবান্ধা", "Gaibandha", "5700", "ফুলছড়ি:Fulchhari|গাইবান্ধা সদর:Gaibandha Sadar|গোবিন্দগঞ্জ:Gobindaganj|পলাশবাড়ী:Palashbari|সাদুল্লাপুর:Sadullapur|সাঘাটা:Saghata|সুন্দরগঞ্জ:Sundarganj"],
  ["কুড়িগ্রাম", "Kurigram", "5600", "ভুরুঙ্গামারী:Bhurungamari|চিলমারী:Chilmari|ফুলবাড়ী:Fulbari|কুড়িগ্রাম সদর:Kurigram Sadar|নাগেশ্বরী:Nageshwari|রাজারহাট:Rajarhat|রৌমারী:Raumari|উলিপুর:Ulipur"],
  ["লালমনিরহাট", "Lalmonirhat", "5500", "আদিতমারী:Aditmari|হাতীবান্ধা:Hatibandha|কালীগঞ্জ:Kaliganj|লালমনিরহাট সদর:Lalmonirhat Sadar|পাটগ্রাম:Patgram"],
  ["জয়পুরহাট", "Joypurhat", "5900", "আক্কেলপুর:Akkelpur|কালাই:Kalai|ক্ষেতলাল:Khetlal|পাঁচবিবি:Panchbibi|জয়পুরহাট সদর:Joypurhat Sadar"],
  ["শরীয়তপুর", "Shariatpur", "8000", "ডামুড্যা:Damudya|গোসাইরহাট:Gosairhat|জাজিরা:Zajira|নড়িয়া:Naria|শরীয়তপুর সদর:Shariatpur Sadar|ভেদরগঞ্জ:Bhedarganj|জঞ্জিরা:Janjira"],
  ["রাজবাড়ী", "Rajbari", "7700", "বালিয়াকান্দি:Baliakandi|গোয়ালন্দ:Goalanda|কালুখালী:Kalukhali|পাংশা:Pangsha|রাজবাড়ী সদর:Rajbari Sadar"],
  ["গোপালগঞ্জ", "Gopalganj", "8100", "কাশিয়ানী:Kashiani|কোটালীপাড়া:Kotalipara|মুকসুদপুর:Muksudpur|গোপালগঞ্জ সদর:Gopalganj Sadar|টুঙ্গিপাড়া:Tungipara"],
  ["নরসিংদী", "Narsingdi", "1600", "বেলাবো:Belabo|মনোহরদী:Monohardi|নরসিংদী সদর:Narsingdi Sadar|পলাশ:Palash|রায়পুরা:Raipura|শিবপুর:Shibpur"],
  ["মাদারীপুর", "Madaripur", "7900", "কালকিনি:Kalkini|মাদারীপুর সদর:Madaripur Sadar|রাজৈর:Rajoir|শিবচর:Shibchar|ডাসার:Dasar"],
];

export const DISTRICTS: District[] = RAW.map(([bn, en, postcode, t]) => ({
  bn,
  en,
  postcode,
  thanas: t.split("|").map((p) => {
    const [tbn, ten] = p.split(":");
    return { bn: tbn, en: ten };
  }),
})).sort((a, b) => a.bn.localeCompare(b.bn, "bn"));

export function findDistrict(en: string): District | undefined {
  return DISTRICTS.find((d) => d.en === en);
}

export function findThana(district: District | undefined, en: string): Thana | undefined {
  return district?.thanas.find((t) => t.en === en);
}

// জেলা → বিভাগ (Facebook-এর "st" প্যারামিটারের জন্য)।
// বানান Facebook-এর লোকেশন তালিকার মতো পুরোনো ইংরেজি নামে (chittagong, barisal),
// কারণ Facebook প্রোফাইলের বিভাগ ওই নামে থাকে।
const DIVISION_DISTRICTS: Record<string, string[]> = {
  dhaka: ["Dhaka", "Gazipur", "Narayanganj", "Munshiganj", "Manikganj", "Narsingdi", "Kishoreganj", "Tangail", "Faridpur", "Gopalganj", "Madaripur", "Rajbari", "Shariatpur"],
  chittagong: ["Chattogram", "Cox's Bazar", "Cumilla", "Brahmanbaria", "Chandpur", "Feni", "Lakshmipur", "Noakhali", "Khagrachhari", "Rangamati", "Bandarban"],
  rajshahi: ["Rajshahi", "Bogura", "Chapai Nawabganj", "Naogaon", "Natore", "Pabna", "Sirajganj", "Joypurhat"],
  khulna: ["Khulna", "Bagerhat", "Satkhira", "Jashore", "Jhenaidah", "Magura", "Narail", "Kushtia", "Chuadanga", "Meherpur"],
  barisal: ["Barishal", "Barguna", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"],
  sylhet: ["Sylhet", "Habiganj", "Moulvibazar", "Sunamganj"],
  rangpur: ["Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Thakurgaon"],
  mymensingh: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
};

const DIVISION_OF: Record<string, string> = Object.fromEntries(
  Object.entries(DIVISION_DISTRICTS).flatMap(([div, ds]) => ds.map((d) => [d, div])),
);

// জেলার ইংরেজি নাম থেকে বিভাগ, যেমন "Gazipur" → "dhaka"। না পেলে খালি।
export function divisionOf(districtEn: string): string {
  return DIVISION_OF[districtEn] || "";
}

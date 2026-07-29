# Billiards JS

- Bu proje, tek kişilik bir bilardo oyunudur.

***

- Siyah topun en sona bırakılması ve beyaz topun her zaman masada kalması kuralları haricinde, diğer bilardo kurallarına bu projede yer verilmemiştir.

- Oyunun 50 tur içinde tamamlanması gerekmektedir.

- Beyaz topun izleyeceği yol, beyaz çizgi ile gösterilmektedir.

- Yansıma özelliği "x" tuşu ile açılabilmekte olup, masanın herhangi bir kenarına çarptıktan sonraki rotayı da göstermektedir.

- Yansıma özelliği, toplara çarptıktan sonra tahmini rotayı göstermemektedir.

- Beyaz topun isabet edeceği topun izleyeceği tahmini yol, sarı çizgi ile gösterilmektedir.

- Sarı çizgi ile daha isabetli tahmin yapılabilmesi için, Sub-step Physics Simulation ve Ray-Circle Intersection yöntemlerinden yararlanılmıştır.

- İlk tur için vuruş şiddeti 7 olarak ayarlanmıştır. Sonraki turlar içinse vuruş şiddetinin 1-5 arasında olması sağlanmış olup, default olarak 3 şiddeti seçilmiştir. Vuruş şiddetini ayarlamak için 1, 2, 3, 4 ve 5 tuşları kullanılmalıdır.

- Topların başlangıç dizilimi her defasında üçgen olmakla birlikte, bu üçgen içerisindeki konumların rastgele olması sağlanmıştır.

- Oyun 2D olmakla birlikte, topların 3D hareket etmeleri sağlanmıştır.
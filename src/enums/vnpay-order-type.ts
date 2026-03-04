export enum VnpayOrderType {
  FOOD_CONSUMABLE = '100000', // Thực Phẩm - Tiêu Dùng
  SNACKS_DRINKS = '100001', // Bánh kẹo - Đồ ăn vặt - Giải khát
  DRY_FOOD = '100003', // Thực phẩm khô
  DAIRY_PRODUCTS = '100004', // Sữa - Kem & sản phẩm từ sữa
  CLEANING_PRODUCTS = '100005', // Hóa phẩm – chất tẩy

  MOBILE_DEVICES = '110000', // Điện thoại - Máy tính bảng
  MOBILE_PHONE = '110001', // Điện thoại di động
  TABLET = '110002', // Máy tính bảng
  SMART_WATCH = '110003', // Smart Watch
  ACCESSORIES = '110004', // Phụ kiện
  SIM_CARD = '110005', // Sim/Thẻ

  HOME_APPLIANCES = '120000', // Điện gia dụng
  KITCHEN_APPLIANCES = '120001', // Điện gia dụng nhà bếp
  FAMILY_APPLIANCES = '120002', // Điện gia dụng gia đình
  LARGE_APPLIANCES = '120003', // Điện lạnh & Điện cỡ lớn

  COMPUTER_OFFICE = '130000', // Máy tính - Thiết bị văn phòng
  LAPTOP = '130001', // Máy tính xách tay
  DESKTOP = '130002', // Máy tính để bàn
  MONITOR = '130003', // Màn hình máy tính
  NETWORK_DEVICE = '130004', // Thiết bị mạng
  SOFTWARE = '130005', // Phần mềm
  COMPUTER_ACCESSORIES = '130006', // Linh kiện, Phụ kiện
  PRINTER = '130007', // Máy in
  OTHER_OFFICE_EQUIP = '130008', // Thiết bị văn phòng khác

  ELECTRONICS_AUDIO = '140000', // Điện tử - Âm thanh
  TV = '140001', // Tivi
  SPEAKER = '140002', // Loa
  AUDIO_SYSTEM = '140003', // Dàn âm thanh
  TECH_TOYS = '140004', // Đồ chơi công nghệ
  DIGITAL_DEVICES = '140005', // Thiết bị Kỹ thuật số

  BOOKS_MAGAZINES = '150000', // Sách/Báo/Tạp chí
  STATIONERY = '150001', // Văn phòng phẩm
  GIFTS = '150002', // Quà tặng
  MUSICAL_INSTRUMENTS = '150003', // Nhạc cụ

  SPORTS_OUTDOOR = '160000', // Thể thao, dã ngoại
  SPORTS_CLOTHING = '160001', // Trang phục thể thao
  SPORTS_ACCESSORIES = '160002', // Phụ kiện thể thao
  FITNESS_EQUIPMENT = '160003', // Đồ tập Yoga, thể hình
  OUTDOOR_GEAR = '160004', // Đồ/Vật dụng Dã ngoại

  HOTEL_TRAVEL = '170000', // Khách sạn & Du lịch
  DOMESTIC_TRAVEL = '170001', // Du lịch trong nước
  INTERNATIONAL_TRAVEL = '170002', // Du lịch nước ngoài
  HOTEL_BOOKING = '170003', // Đặt phòng khách sạn

  CULINARY = '180000', // Ẩm thực

  ENTERTAINMENT_EDUCATION = '190000', // Giải trí & Đào tạo
  MOVIE_TICKET = '190001', // Vé xem phim
  ONLINE_LEARNING_CARD = '190002', // Thẻ học/ Học trực tuyến
  OTHER_ENTERTAINMENT = '190003', // Giải trí, vui chơi khác
  MEMBERSHIP_CARD = '190004', // Thẻ học trực tuyến/Thẻ hội viên

  FASHION = '200000', // Thời trang
  WOMEN_FASHION = '200001', // Thời trang nữ
  WOMEN_ACCESSORIES = '200002', // Phụ kiện Nữ
  MEN_FASHION = '200003', // Thời trang Nam
  KIDS_FASHION = '200004', // Thời trang Trẻ Em

  HEALTH_BEAUTY = '210000', // Sức khỏe - Làm đẹp
  SUNSCREEN = '210001', // Kem chống nắng
  FACIAL_CARE = '210002', // Chăm sóc da mặt
  COSMETICS = '210003', // Trang điểm
  PERSONAL_CARE = '210004', // Chăm sóc cá nhân

  MOM_BABY = '220000', // Mẹ & Bé
  BABY_MILK = '220001', // Sữa & Bột cho bé
  BABY_CARE = '220002', // Vệ sinh chăm sóc cho bé
  TOYS_BABY_ITEMS = '220003', // Đồ chơi & Đồ dùng trẻ em
  BABY_FEEDING = '220004', // Đồ dùng ăn uống cho bé

  KITCHENWARE = '230000', // Vật dụng nhà bếp
  FURNITURE = '230001', // Nội thất

  VEHICLES = '240000', // Xe cộ - phương tiện
  MOTORBIKE = '240001', // Mô tô - Xe máy
  MOTORBIKE_ACCESSORIES = '240002', // Phụ kiện xe máy
  CAR_ACCESSORIES = '240003', // Phụ kiện ô tô
  ELECTRIC_BIKE = '240004', // Xe đạp điện

  BILL_PAYMENT = '250000', // Thanh toán hóa đơn
  ELECTRIC_BILL = '250001', // Hóa đơn tiền điện
  WATER_BILL = '250002', // Hóa đơn tiền nước
  PHONE_BILL = '250003', // Hóa đơn điện thoại trả sau
  ADSL_BILL = '250004', // Hóa đơn ADSL
  CABLE_TV_BILL = '250005', // Hóa đơn truyền hình cáp
  SERVICE_BILL = '250006', // Hóa đơn dịch vụ
  FLIGHT_TICKET = '250007', // Vé máy bay

  CARD_PURCHASE = '260000', // Mua mã thẻ
  PHONE_CARD = '260001', // Thẻ điện thoại
  GAME_CARD = '260002', // Thẻ Game

  MEDICAL_SERVICES = '270000', // Nhà thuốc - Dịch vụ y tế
  HOSPITAL_REGISTRATION = '270001', // Đăng ký khám/chữa bệnh
}

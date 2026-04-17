import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <div className={styles.wrap}>
      <header className={styles.headerHero}>
        <div className={styles.headerBg} aria-hidden="true" />
        <div className={styles.headerInner}>
          <div className={styles.headerText}>
            <div className={styles.pill}>Quản lý tài chính cá nhân</div>
            <h1 className={styles.title}>Ghi thu/chi nhanh</h1>
            <h2 className={styles.title2}>Theo dõi và kiểm soát chi tiêu mỗi ngày</h2>
            <p className={styles.desc}>
              Finance Manager giúp bạn ghi lại giao dịch hằng ngày, phân loại theo danh mục và theo dõi tổng thu, tổng chi và số dư để
              lên kế hoạch chi tiêu hợp lý hơn.
            </p>

            <div className={styles.ctaBlock}>
              <div className={styles.ctaLabel}>Đăng ký nhận tư vấn</div>
              <div className={styles.ctaRow}>
                <input className={styles.ctaInput} placeholder="Nhập email của bạn" />
                <button className={styles.ctaButton} type="button">
                  Đăng ký <span className={styles.ctaArrow}>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.overlap}>
        <div className={styles.aboutCard}>
          <div className={styles.aboutLeft}>
            <div className={styles.aboutTitle}>Về chúng tôi</div>
            <div className={styles.aboutDesc}>
              Finance Manager được xây dựng với mục tiêu giúp việc theo dõi thu/chi trở nên đơn giản, rõ ràng và dễ duy trì mỗi ngày.
              Chúng tôi tập trung vào trải nghiệm nhập liệu nhanh, phân loại hợp lý và thống kê trực quan để bạn nắm được dòng tiền của mình.
              <br />
              <br />
              Đồng hành cùng bạn trong hành trình quản lý tài chính cá nhân, hệ thống hướng đến việc hình thành thói quen ghi chép đều đặn,
              từ đó đưa ra quyết định chi tiêu hợp lý và cân đối ngân sách tốt hơn.
              <br />
              <br />
              Mục tiêu của chúng tôi là giúp bạn quản lý tài chính hiệu quả hơn thông qua trải nghiệm đơn giản, trực quan và dễ duy trì.
            </div>
          </div>
          <div className={styles.aboutRight} aria-hidden="true">
            <div className={styles.aboutImage} />
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.panel}>
          <div className={styles.panelTop}>
            <div>
              <div className={styles.panelTitle}>Luồng sử dụng</div>
              <div className={styles.panelSub}>4 bước để quản lý tài chính mỗi ngày</div>
            </div>
            <div className={styles.panelBadge}>MVP</div>
          </div>

          <div className={styles.stepsGrid}>
            <div className={[styles.stepItem, styles.stepBrown].join(' ')}>
              <div>
                <div className={styles.stepHeader}>
                  <div className={styles.stepIcon} aria-hidden="true">
                    01
                  </div>
                  <div className={styles.stepTitle}>Đăng nhập</div>
                </div>
                <div className={styles.stepDesc}>Đăng nhập để lưu và đồng bộ dữ liệu cá nhân.</div>
                <div className={styles.stepMore}>
                  - Truy cập nhanh các tính năng chính
                  <br />- Trải nghiệm liền mạch, dễ sử dụng
                </div>
              </div>
            </div>
            <div className={[styles.stepItem, styles.stepPurple].join(' ')}>
              <div>
                <div className={styles.stepHeader}>
                  <div className={styles.stepIcon} aria-hidden="true">
                    02
                  </div>
                  <div className={styles.stepTitle}>Tạo danh mục</div>
                </div>
                <div className={styles.stepDesc}>Nhóm chi tiêu (ăn uống, di chuyển, giải trí...).</div>
                <div className={styles.stepMore}>
                  - Tuỳ chỉnh theo thói quen chi tiêu
                  <br />- Nhìn rõ bạn đang chi nhiều ở đâu
                </div>
              </div>
            </div>
            <div className={[styles.stepItem, styles.stepTeal].join(' ')}>
              <div>
                <div className={styles.stepHeader}>
                  <div className={styles.stepIcon} aria-hidden="true">
                    03
                  </div>
                  <div className={styles.stepTitle}>Thêm giao dịch</div>
                </div>
                <div className={styles.stepDesc}>Ghi thu/chi, ghi chú và chọn danh mục.</div>
                <div className={styles.stepMore}>
                  - Nhập liệu nhanh theo ngày
                  <br />- Dễ tìm và theo dõi theo danh mục
                </div>
              </div>
            </div>
            <div className={[styles.stepItem, styles.stepRed].join(' ')}>
              <div>
                <div className={styles.stepHeader}>
                  <div className={styles.stepIcon} aria-hidden="true">
                    04
                  </div>
                  <div className={styles.stepTitle}>Xem tổng quan</div>
                </div>
                <div className={styles.stepDesc}>Tổng quan thu/chi/số dư và biểu đồ cơ bản.</div>
                <div className={styles.stepMore}>
                  - Theo dõi xu hướng chi tiêu theo thời gian
                  <br />- Ra quyết định chi tiêu hợp lý hơn
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionTitle}>Giá trị</div>
        <div className={styles.missionGrid}>
          <div className={styles.missionCard}>
            <div className={[styles.missionIcon, styles.missionIconRed].join(' ')} aria-hidden="true">
              ★
            </div>
            <div className={styles.missionTitle}>Sứ mệnh</div>
            <div className={styles.missionDesc}>
              Đồng hành cùng bạn trên hành trình xây dựng thói quen ghi chép thu/chi đều đặn, giúp dòng tiền rõ ràng và dễ kiểm soát mỗi
              ngày. Từ đó bạn chủ động hơn trong chi tiêu, cân đối ngân sách và từng bước đạt mục tiêu tài chính.
            </div>
          </div>

          <div className={styles.missionCard}>
            <div className={[styles.missionIcon, styles.missionIconBlue].join(' ')} aria-hidden="true">
              ◎
            </div>
            <div className={styles.missionTitle}>Tầm nhìn</div>
            <div className={styles.missionDesc}>
              Trở thành trợ lý quản lý tài chính cá nhân đơn giản và đáng tin cậy, nơi bạn có thể theo dõi thu/chi, xem tổng quan và ra
              quyết định nhanh chóng dựa trên dữ liệu của chính mình. Mọi thứ được thiết kế trực quan, dễ dùng và dễ duy trì lâu dài.
            </div>
          </div>

          <div className={styles.missionCard}>
            <div className={[styles.missionIcon, styles.missionIconGreen].join(' ')} aria-hidden="true">
              ✓
            </div>
            <div className={styles.missionTitle}>Giá trị cốt lõi</div>
            <div className={styles.missionDesc}>
              Đơn giản để dễ duy trì, rõ ràng để dễ kiểm soát và nhất quán để bạn theo dõi lâu dài. Mỗi tính năng đều hướng đến việc giúp bạn
              hành động nhanh hơn, nhìn tổng quan tốt hơn và ra quyết định chi tiêu tự tin hơn.
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.box}>
          <div className={styles.boxTitle}>Câu hỏi thường gặp</div>
          <div className={styles.faq}>
            <details className={styles.faqItem}>
              <summary className={styles.faqQ}>Có cần nhập mọi khoản chi không?</summary>
              <div className={styles.faqA}>Chỉ cần nhập các khoản chính để có bức tranh tổng quan.</div>
            </details>

            <details className={styles.faqItem}>
              <summary className={styles.faqQ}>Dữ liệu của tôi có riêng tư không?</summary>
              <div className={styles.faqA}>Dữ liệu gắn theo tài khoản; đăng nhập mới xem và chỉnh sửa được.</div>
            </details>

            <details className={styles.faqItem}>
              <summary className={styles.faqQ}>Tôi có thể tạo danh mục theo ý mình không?</summary>
              <div className={styles.faqA}>Có. Bạn có thể tạo và tuỳ chỉnh danh mục để phù hợp thói quen chi tiêu của mình.</div>
            </details>

            <details className={styles.faqItem}>
              <summary className={styles.faqQ}>Nếu quên nhập một giao dịch thì sao?</summary>
              <div className={styles.faqA}>Bạn có thể thêm lại bất cứ lúc nào. Chỉ cần chọn đúng ngày và danh mục là thống kê sẽ cập nhật.</div>
            </details>

            <details className={styles.faqItem}>
              <summary className={styles.faqQ}>Có hỗ trợ ghi chú cho từng giao dịch không?</summary>
              <div className={styles.faqA}>Có. Ghi chú giúp bạn nhớ lý do chi tiêu và dễ tìm lại khi cần rà soát.</div>
            </details>

            <details className={styles.faqItem}>
              <summary className={styles.faqQ}>Tổng quan thu/chi được tính theo tuần hay theo tháng?</summary>
              <div className={styles.faqA}>Bạn có thể xem theo tuần hoặc theo tháng tuỳ nhu cầu theo dõi và lập kế hoạch.</div>
            </details>

            <details className={styles.faqItem}>
              <summary className={styles.faqQ}>Tôi có thể tách Thu và Chi để dễ theo dõi không?</summary>
              <div className={styles.faqA}>Có. Hệ thống phân biệt thu và chi, giúp bạn nhìn rõ dòng tiền vào/ra và số dư.</div>
            </details>

            <details className={styles.faqItem}>
              <summary className={styles.faqQ}>Có thể dùng trên điện thoại không?</summary>
              <div className={styles.faqA}>Có. Giao diện được tối ưu để thao tác tốt trên cả máy tính và điện thoại.</div>
            </details>
          </div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.box}>
          <div className={styles.boxTitle}>Liên hệ</div>
          <div className={styles.contactInfo}>
            <div className={styles.contactLead}>
              Bạn cần tư vấn hoặc muốn góp ý để Finance Manager tốt hơn? Bạn có thể liên hệ theo các kênh bên dưới, chúng tôi sẽ phản hồi sớm.
            </div>
            <div className={styles.contactList}>
              <div className={styles.contactRow}>
                <div className={styles.contactIcon} aria-hidden="true">
                  @
                </div>
                <div className={styles.contactLabel}>Email</div>
                <a className={styles.contactValue} href="mailto:support@financemanager.vn">
                  support@financemanager.vn
                </a>
              </div>
              <div className={styles.contactRow}>
                <div className={styles.contactIcon} aria-hidden="true">
                  ☎
                </div>
                <div className={styles.contactLabel}>Hotline</div>
                <a className={styles.contactValue} href="tel:0900000000">
                  0900 000 000
                </a>
              </div>
              <div className={styles.contactRow}>
                <div className={styles.contactIcon} aria-hidden="true">
                  ⏱
                </div>
                <div className={styles.contactLabel}>Giờ làm việc</div>
                <div className={styles.contactValue}>Thứ 2 – Thứ 6, 09:00 – 18:00</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


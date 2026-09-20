INSERT OR IGNORE INTO products (
  product_code,
  product_type,
  product_name,
  description,
  price_npr,
  status,
  cover_image_url
) VALUES (
  'NEPALI-BIBLE-QUIZ',
  'software',
  'Nepali Bible Quiz',
  'Professional bilingual Bible quiz and projection software',
  3500,
  'active',
  '/assets/images/software/nepali-bible-quiz-app-icon.png'
);

INSERT OR IGNORE INTO software_products (
  product_id,
  version,
  installer_file_url,
  installation_guide_url,
  user_manual_url,
  licence_required,
  licence_type_default
)
SELECT
  id,
  '1.0.2',
  '',
  'https://durgajung.com.np/software#purchase-nepali-bible-quiz',
  'https://durgajung.com.np/software#nbq-features',
  1,
  'customer'
FROM products
WHERE product_code = 'NEPALI-BIBLE-QUIZ'
  AND NOT EXISTS (
    SELECT 1
    FROM software_products
    WHERE product_id = products.id
  );

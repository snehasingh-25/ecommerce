# Product Recommendation Engine - Examples & Use Cases

## Real-World Scenarios

### Scenario 1: Gift Set Shopping

**User Journey:**
```
1. User views: Premium Gift Box Set (Category: Gift Sets, Price: ₹599)
2. System analyzes:
   - Category: Gift Sets
   - Price range: ₹480-720 (±20%)
   - Trending: Yes
   - Occasions: Birthday, Anniversary

3. Recommendations returned (in order):
   ✓ Other gift boxes in price range (₹480-720)
   ✓ Other trending gift sets
   ✓ Birthday/Anniversary gift options
   ✓ New gift set arrivals
   ✓ Festival special offers

4. User sees carousel:
   "Customers Also Loved"
   ├─ Luxury Gift Hamper (₹550)
   ├─ Birthday Surprise Box (₹600)
   ├─ Personalized Gift Set (₹650)
   └─ ... and 7 more
```

**Expected Behavior:**
- Carousel auto-scrolls through products
- User can manually navigate with arrows
- Clicking a product goes to its detail page
- Section title differs next time page loads

---

### Scenario 2: Occasion-Based Shopping

**User Journey:**
```
1. User views: Valentine's Day Chocolate Set (₹299)
2. System analyzes:
   - Occasion: Valentine's Day
   - Category: Chocolates
   - Price range: ₹240-360 (±20%)
   - New: Yes

3. Recommendations returned:
   ✓ Other Valentine's products in price range
   ✓ Other chocolate sets
   ✓ Valentine's day gifts (all categories)
   ✓ Trending romantic gifts
   ✓ New Valentine arrivals

4. Carousel shows:
   "Recommended For You"
   ├─ Rose & Chocolate Combo (₹320)
   ├─ Love Card + Gifts Bundle (₹280)
   ├─ Premium Chocolate Box (₹350)
   └─ ... and 7 more
```

**Expected Behavior:**
- All recommendations are Valentine's appropriate
- Price range respected (±20%)
- User stays on site longer viewing related items
- Increases chance of adding multiple products

---

### Scenario 3: Budget-Conscious Shopping

**User Journey:**
```
1. User views: Affordable Greeting Card (₹99)
2. System analyzes:
   - Category: Cards & Stationery
   - Price range: ₹80-120 (±20%)
   - Trending: No
   - Budget: Low

3. Recommendations returned:
   ✓ Other cards/stationery in price range
   ✓ Budget gift options (₹80-120)
   ✓ Popular affordable items
   ✓ Trending budget gifts
   ✓ New arrival budget items

4. Carousel shows:
   "You May Also Like"
   ├─ Decorative Gift Envelope (₹89)
   ├─ Handmade Greeting Card (₹105)
   ├─ Thank You Card Pack (₹95)
   └─ ... and 7 more
```

**Expected Behavior:**
- All recommendations within budget
- No premium/luxury items shown
- Encourages "add one more item" impulse buys
- Increases cart value without breaking budget

---

## Technical Examples

### Example API Call

**Request:**
```bash
GET http://localhost:3000/recommendations/42?limit=10
```

**Response:**
```json
[
  {
    "id": 45,
    "name": "Deluxe Gift Hamper",
    "description": "A carefully curated collection...",
    "hasSinglePrice": false,
    "singlePrice": null,
    "images": "[\"url1.jpg\", \"url2.jpg\"]",
    "isTrending": true,
    "isNew": false,
    "isFestival": false,
    "isReady60Min": false,
    "badge": null,
    "order": 5,
    "createdAt": "2024-01-15T10:30:00Z",
    "categories": [
      {
        "category": {
          "id": 3,
          "name": "Gift Hampers",
          "slug": "gift-hampers",
          "description": "Premium curated gift collections",
          "imageUrl": "category.jpg",
          "order": 1,
          "createdAt": "2023-12-01T00:00:00Z",
          "updatedAt": "2024-01-20T15:30:00Z"
        }
      }
    ],
    "sizes": [
      {
        "id": 10,
        "label": "Standard",
        "price": 599.99
      },
      {
        "id": 11,
        "label": "Deluxe",
        "price": 799.99
      }
    ],
    "occasions": [
      {
        "occasion": {
          "id": 1,
          "name": "Birthday",
          "slug": "birthday",
          "description": "Birthday gifts",
          "imageUrl": "birthday.jpg",
          "order": 1,
          "createdAt": "2023-12-01T00:00:00Z",
          "updatedAt": "2024-01-20T15:30:00Z"
        }
      },
      {
        "occasion": {
          "id": 5,
          "name": "Anniversary",
          "slug": "anniversary",
          "description": "Anniversary gifts",
          "imageUrl": "anniversary.jpg",
          "order": 5,
          "createdAt": "2023-12-01T00:00:00Z",
          "updatedAt": "2024-01-20T15:30:00Z"
        }
      }
    ]
  },
  // ... 9 more products
]
```

---

## Frontend Integration Examples

### Basic Usage

```jsx
import RecommendationCarousel from "../components/RecommendationCarousel";

// In your component:
const [recommendedProducts, setRecommendedProducts] = useState([]);
const [isLoading, setIsLoading] = useState(false);

// Fetch recommendations
useEffect(() => {
  setIsLoading(true);
  fetch(`/api/recommendations/${productId}?limit=10`)
    .then(res => res.json())
    .then(data => {
      setRecommendedProducts(data);
      setIsLoading(false);
    });
}, [productId]);

// Render
return (
  <RecommendationCarousel 
    products={recommendedProducts}
    isLoading={isLoading}
  />
);
```

### Advanced: With Error Handling

```jsx
const [recommendedProducts, setRecommendedProducts] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setIsLoading(true);
  setError(null);
  
  const controller = new AbortController();
  
  fetch(`/api/recommendations/${productId}?limit=10`, {
    signal: controller.signal
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to load recommendations');
      return res.json();
    })
    .then(data => {
      setRecommendedProducts(data);
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        setError(err.message);
        console.error('Recommendation error:', err);
      }
    })
    .finally(() => setIsLoading(false));
    
  return () => controller.abort();
}, [productId]);

return (
  <>
    {error && (
      <div className="text-red-600 mb-4">
        Could not load recommendations
      </div>
    )}
    <RecommendationCarousel 
      products={recommendedProducts}
      isLoading={isLoading}
    />
  </>
);
```

---

## Data Structure Examples

### Product Object Structure

```javascript
{
  // Basic Info
  id: 42,
  name: "Premium Gift Set",
  description: "Detailed product description...",
  badge: "Premium",
  
  // Pricing
  hasSinglePrice: false,
  singlePrice: null,
  sizes: [
    { id: 1, label: "Small", price: 499 },
    { id: 2, label: Large", price: 799 }
  ],
  
  // Images
  images: "[\"url1.jpg\", \"url2.jpg\", \"url3.jpg\"]",
  
  // Attributes
  isTrending: true,
  isNew: false,
  isFestival: false,
  isReady60Min: true,
  
  // Relationships
  categories: [
    { category: { id: 5, name: "Gift Sets", slug: "gift-sets" } }
  ],
  occasions: [
    { occasion: { id: 1, name: "Birthday", slug: "birthday" } },
    { occasion: { id: 5, name: "Anniversary", slug: "anniversary" } }
  ],
  
  // Metadata
  order: 5,
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-20T15:30:00Z"
}
```

---

## Performance Examples

### Caching in Action

**First Request (Uncached):**
```
Time: 0ms   - Frontend sends request
Time: 50ms  - Backend receives request
Time: 150ms - Database query completes
Time: 200ms - Backend returns response
Time: 220ms - Frontend receives data
Result: 220ms total response time
```

**Second Request (Cached, within 10 minutes):**
```
Time: 0ms   - Frontend sends request
Time: 50ms  - Backend retrieves from cache
Time: 60ms  - Backend returns response
Time: 80ms  - Frontend receives data
Result: 80ms total response time
Savings: 140ms (64% faster!)
```

### Scalability Example

**With 10,000+ Products:**
```
Without Caching:
- 100 concurrent users viewing different products
- Each request queries database
- Database load: 100 queries/second
- Response time: 200-500ms

With Caching:
- 100 concurrent users
- Cache hit rate: 85% (same products viewed repeatedly)
- Only 15 database queries
- Average response time: 80-150ms
- Server can handle 10x more users!
```

---

## Carousel Interaction Examples

### Auto-Scroll Cycle

```
t=0s:  User visits page
       Carousel renders with 10 products
       Auto-scroll starts

t=5s:  Carousel scrolls to next set
       "Product 1-4" → "Product 5-8"

t=10s: Carousel scrolls again
       "Product 5-8" → "Product 9-10" + start

t=15s: Carousel wraps around
       "Product 9-10" → "Product 1-4" (reset)

t=20s: Cycle continues...
```

### User Interaction Example

```
t=0s:  Auto-scroll starts
t=3s:  User hovers over carousel
       Auto-scroll pauses
       Navigation arrows appear
       
t=4s:  User clicks right arrow
       Carousel scrolls to next items
       Auto-scroll timer resets
       
t=4.5s: User moves mouse away
        Navigation arrows fade
        
t=5s:   Timer reaches 500ms after interaction
        Auto-scroll resumes
        
t=10s:  Carousel scrolls (5 seconds from reset)
        Cycle continues
```

---

## SEO & Analytics Examples

### Tracking Recommendations

```javascript
// Track when recommendation carousel is viewed
gtag.event('view_recommendation_carousel', {
  product_id: currentProductId,
  recommendation_count: 10,
  section_title: 'You May Also Like'
});

// Track when recommendation is clicked
gtag.event('recommendation_click', {
  source_product_id: currentProductId,
  target_product_id: recommendedProductId,
  target_product_name: productName,
  section_title: 'You May Also Like',
  position: 3 // Position in carousel
});

// Track conversion from recommendation
gtag.event('purchase_from_recommendation', {
  source_product_id: originalProductId,
  recommended_product_id: purchasedProductId,
  revenue: price,
  currency: 'INR'
});
```

### Expected Analytics Data

```
Baseline (Without Recommendations):
- Avg products viewed/session: 3.2
- Avg session duration: 2:45
- Bounce rate: 68%
- AOV: ₹1,250

With Recommendations:
- Avg products viewed/session: 4.1 (+28%)
- Avg session duration: 3:30 (+27%)
- Bounce rate: 55% (-19%)
- AOV: ₹1,450 (+16%)
```

---

## Testing Scenarios

### Test Case 1: Happy Path
```
Given: User on product detail page
When:  Recommendations load successfully
Then:  Carousel displays 10 products
AND:   Auto-scroll starts after 5 seconds
AND:   Navigation arrows visible on hover
```

### Test Case 2: No Products Available
```
Given: Product with no category/occasion matches
When:  Recommendation API called
Then:  Fallback to any high-quality products
AND:   Carousel still renders
AND:   User can browse alternatives
```

### Test Case 3: Mobile Touch Scroll
```
Given: User on mobile device
When:  User swipes left in carousel
Then:  Carousel scrolls smoothly
AND:   Auto-scroll pauses
AND:   Scrolling resumes after 500ms
```

### Test Case 4: Network Error
```
Given: Recommendation API is down
When:  User visits product page
Then:  Product page loads normally
AND:   Recommendation carousel not rendered
AND:   No errors shown to user
```

---

## Optimization Tips

### For Performance
1. **Increase Cache Duration**
   - Change from 10 minutes to 30 minutes
   - Reduces database load significantly

2. **Preload Top Products**
   - Pre-compute recommendations for bestsellers
   - Instant response for popular items

3. **Limit API Response Size**
   - Return only essential product data
   - Reduce payload by 30-40%

### For Engagement
1. **A/B Test Title Variations**
   - Track CTR for each title variant
   - Use highest performer more often

2. **Adjust Auto-Scroll Speed**
   - Faster (3s) for impulse buyers
   - Slower (7s) for comparison shoppers

3. **Show Social Proof**
   - Add star ratings
   - Show "Most Popular" badge
   - Display "X people bought this"

### For Conversion
1. **Personalize Recommendations**
   - Track user browsing history
   - Recommend based on past views

2. **Add Trust Signals**
   - Show price discounts
   - Display limited stock indicators
   - Highlight fast shipping

3. **Optimize Product Order**
   - Put best-selling products first
   - Prioritize high-margin items
   - Consider seasonal relevance

---

## Troubleshooting Examples

### Issue: "Carousel Not Scrolling"

**Debug Steps:**
```javascript
// Check if products loaded
console.log('Products:', recommendedProducts);
// Should show array with 6+ items

// Check container scroll width
const container = document.querySelector('[role="region"]');
console.log('ScrollWidth:', container.scrollWidth);
console.log('ClientWidth:', container.clientWidth);
// scrollWidth should be > clientWidth to enable scroll

// Check CSS classes
console.log(container.className);
// Should include "overflow-x-auto" and "scroll-smooth"
```

### Issue: "API Returns Empty Array"

**Debug Steps:**
```javascript
// Check product has data
fetch('/products/42')
  .then(r => r.json())
  .then(p => console.log('Product:', p));
// Should show complete product with categories

// Check recommendation endpoint directly
fetch('/recommendations/42?limit=10')
  .then(r => r.json())
  .then(d => console.log('Recommendations:', d));
// Should return 6-10 products (or empty if no matches)
```

### Issue: "Auto-Scroll Not Working"

**Debug Steps:**
```javascript
// Check interval is running
// Add to RecommendationCarousel:
console.log('Auto-scroll started for', products.length, 'products');

// Verify container ref is valid
console.log('Container:', scrollContainerRef.current);
// Should show DOM element

// Check if component unmounted
// Add cleanup check in useEffect
return () => {
  console.log('Cleaning up auto-scroll');
  if (autoScrollTimeoutRef.current) clearInterval(...);
};
```

---

## Conclusion

This implementation guide covers:
✅ Real-world use cases
✅ Technical examples
✅ Performance scenarios
✅ Analytics tracking
✅ Troubleshooting guides
✅ Optimization tips

Your recommendation engine is ready to drive real business value!

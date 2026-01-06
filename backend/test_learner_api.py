"""
Test script for learner profile API endpoints
Run this after starting the backend to verify everything works
"""
import requests
import json

API_BASE = "http://127.0.0.1:5000"

def test_model_status():
    """Test if models are loaded"""
    print("\n" + "="*60)
    print("TEST 1: Check Model Status")
    print("="*60)
    
    response = requests.get(f"{API_BASE}/learner/model-status")
    print(f"Status Code: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    
    return response.json()


def test_analyze_student():
    """Test complete student analysis"""
    print("\n" + "="*60)
    print("TEST 2: Analyze Student")
    print("="*60)
    
    # Sample student data
    student_data = {
        "student_id": "test_student_001",
        "total_clicks": 2500,
        "active_days": 75,
        "avg_clicks_per_day": 33.3,
        "clicks_last_week": 250,
        "avg_assessment_score": 78.5,
        "assessments_completed": 8,
        "late_submissions": 1,
        "assessment_pass_rate": 0.875,
        "age_band": "0-35",
        "gender": "M",
        "disability": "N",
        "highest_education": "A Level or Equivalent",
        "region": "East Anglian Region",
        "imd_band": "50-75%",
        "num_prev_attempts": 0,
        "studied_credits": 60,
        "days_since_registration": 90,
        "engagement_trend": 0.5,
        "days_inactive": 5,
        "weekend_activity_ratio": 0.3,
        "evening_activity_ratio": 0.4,
        "engagement_consistency": 0.7,
        "content_views": 150,
        "resource_downloads": 25,
        "forum_posts": 10,
        "quiz_attempts": 15
    }
    
    response = requests.post(
        f"{API_BASE}/learner/analyze",
        json=student_data
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\n📊 Analysis Results:")
        print(f"  Profile: {result['profile']['profile']} (confidence: {result['profile']['confidence']:.2%})")
        print(f"  Outcome: {result['outcome']['outcome']} (confidence: {result['outcome']['confidence']:.2%})")
        print(f"  Risk Level: {result['outcome']['risk_level']}")
        print(f"  At Risk: {result['outcome']['is_at_risk']}")
        
        if result.get('recommendations'):
            print(f"\n💡 Recommendations:")
            for rec in result['recommendations']:
                print(f"  [{rec['priority'].upper()}] {rec['type']}: {rec['message']}")
    else:
        print(f"Error: {response.text}")
    
    return response.json() if response.status_code == 200 else None


def test_classify_profile():
    """Test profile classification only"""
    print("\n" + "="*60)
    print("TEST 3: Classify Learner Profile")
    print("="*60)
    
    student_data = {
        "student_id": "fast_learner_001",
        "total_clicks": 4500,
        "active_days": 90,
        "avg_clicks_per_day": 50.0,
        "clicks_last_week": 400,
        "avg_assessment_score": 92.0,
        "assessments_completed": 10,
        "late_submissions": 0,
        "age_band": "0-35",
        "gender": "F",
        "disability": "N",
        "highest_education": "HE Qualification",
        "num_prev_attempts": 0,
        "studied_credits": 90,
        "days_since_registration": 100,
        "engagement_trend": 1.0
    }
    
    response = requests.post(
        f"{API_BASE}/learner/classify-profile",
        json=student_data
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n👤 Profile: {result['profile']}")
        print(f"   Confidence: {result['confidence']:.2%}")
        print(f"\n   All Probabilities:")
        for profile, prob in result['all_probabilities'].items():
            bar = "█" * int(prob * 50)
            print(f"   {profile:20s} {bar} {prob:.2%}")
    else:
        print(f"Error: {response.text}")


def test_predict_outcome():
    """Test outcome prediction only"""
    print("\n" + "="*60)
    print("TEST 4: Predict Student Outcome")
    print("="*60)
    
    student_data = {
        "student_id": "at_risk_001",
        "total_clicks": 500,
        "active_days": 20,
        "avg_clicks_per_day": 10.0,
        "clicks_last_week": 30,
        "avg_assessment_score": 35.0,
        "assessments_completed": 3,
        "late_submissions": 5,
        "age_band": "35-55",
        "gender": "M",
        "disability": "Y",
        "highest_education": "Lower Than A Level",
        "num_prev_attempts": 2,
        "studied_credits": 30,
        "days_since_registration": 60,
        "engagement_trend": -0.5
    }
    
    response = requests.post(
        f"{API_BASE}/learner/predict-outcome",
        json=student_data
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n🎯 Outcome: {result['outcome']}")
        print(f"   Confidence: {result['confidence']:.2%}")
        print(f"   Risk Level: {result['risk_level']}")
        print(f"   At Risk: {'⚠️ YES' if result['is_at_risk'] else '✓ NO'}")
    else:
        print(f"Error: {response.text}")


def test_recommend_courses():
    """Test course recommendations based on profile"""
    print("\n" + "="*60)
    print("TEST 5: Get Profile-Based Course Recommendations")
    print("="*60)
    
    request_data = {
        "student_data": {
            "student_id": "balanced_learner_001",
            "total_clicks": 2000,
            "active_days": 60,
            "avg_clicks_per_day": 33.3,
            "clicks_last_week": 200,
            "avg_assessment_score": 70.0,
            "assessments_completed": 6,
            "late_submissions": 2,
            "age_band": "0-35",
            "gender": "F",
            "disability": "N",
            "highest_education": "A Level or Equivalent",
            "num_prev_attempts": 0,
            "studied_credits": 60,
            "days_since_registration": 80,
            "engagement_trend": 0.3
        },
        "preferred_difficulty": "Intermediate",
        "max_recommendations": 5
    }
    
    response = requests.post(
        f"{API_BASE}/learner/recommend-courses",
        json=request_data
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n👤 Student Profile: {result['student_profile']}")
        print(f"⚠️  Risk Level: {result['risk_level']}")
        print(f"\n📚 Recommended Courses:")
        
        for i, course in enumerate(result['recommended_courses'][:5], 1):
            print(f"\n  {i}. {course['course_name']}")
            print(f"     University: {course['university']}")
            print(f"     Difficulty: {course['difficulty']} | Rating: ⭐ {course['rating']:.1f}")
            print(f"     Match Score: {course['match_score']:.0%}")
            print(f"     Why: {course['reasoning']}")
    else:
        print(f"Error: {response.text}")


def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 LEARNER PROFILE API TESTS")
    print("="*60)
    print(f"API Base: {API_BASE}")
    
    try:
        # Check if API is running
        response = requests.get(f"{API_BASE}/health")
        if response.status_code != 200:
            print("\n❌ API is not running! Start the backend first:")
            print("   cd backend")
            print("   python main.py")
            return
    except Exception as e:
        print(f"\n❌ Cannot connect to API: {e}")
        print("   Start the backend first: python main.py")
        return
    
    # Run tests
    test_model_status()
    test_analyze_student()
    test_classify_profile()
    test_predict_outcome()
    test_recommend_courses()
    
    print("\n" + "="*60)
    print("✅ All tests completed!")
    print("="*60)


if __name__ == "__main__":
    run_all_tests()

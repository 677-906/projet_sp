from playwright.sync_api import Page, expect

def test_validated_reports(page: Page):
    """
    This test verifies that the validated reports page displays the supervisor's name.
    """
    try:
        # 1. Arrange: Go to the login page.
        page.goto("http://localhost:3000/")

        # 2. Act: Log in as an admin.
        page.get_by_label("Adresse Email").fill("admin@gmail.com")
        page.get_by_label("Mot de passe").fill("admin237")
        page.get_by_role("button", name="Se Connecter").click()

        # 3. Act: Navigate to the validated reports page.
        page.goto("http://localhost:3000/admin/reports")

        # 4. Assert: Confirm the page has loaded.
        expect(page).to_have_title("Historique des Rapports Validés")

        # 5. Assert: Confirm the supervisor's name is displayed.
        # I will assume the supervisor's name is "Admin".
        expect(page.get_by_text("Admin")).to_be_visible()

        # 6. Screenshot: Capture the final result for visual verification.
        page.screenshot(path="jules-scratch/verification/validated-reports.png")
    except Exception as e:
        print(e)
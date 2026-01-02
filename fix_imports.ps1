$replacements = @{
    '@/components/pms/guests/' = '@/modules/guests/components/';
    '@/components/pms/reservations/' = '@/modules/reservations/components/';
    '@/components/pms/frontdesk/' = '@/modules/frontdesk/components/';
    '@/components/pms/housekeeping/' = '@/modules/housekeeping/components/';
    '@/components/pms/rooms/' = '@/modules/housekeeping/components/';
    '@/components/pms/dashboard/' = '@/modules/dashboard/components/';
    '@/components/pms/reports/' = '@/modules/reports/components/';
    '@/components/pms/settings/' = '@/modules/settings/components/';
    '@/components/pms/users/' = '@/modules/settings/components/';
    '@/components/pms/auth/' = '@/modules/auth/components/';
    '@/components/pms/cashier/' = '@/modules/billing/components/';
    '@/components/pms/nightAudit/' = '@/modules/billing/components/';
    '@/components/pms/billing/' = '@/modules/billing/components/'
}

Get-ChildItem -Path "apps/admin/src/modules" -Recurse -Filter "*.vue" | ForEach-Object {
    $txt = [System.IO.File]::ReadAllText($_.FullName)
    $original = $txt
    foreach ($key in $replacements.Keys) {
        $txt = $txt.Replace($key, $replacements[$key])
    }
    if ($txt -ne $original) {
        [System.IO.File]::WriteAllText($_.FullName, $txt)
        Write-Host "Updated $($_.Name)"
    }
}

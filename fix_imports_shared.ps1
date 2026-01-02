$replacements = @{
    '@/components/pms/common/' = '@/modules/shared/components/';
    '@/components/pms/PmsProvider.vue' = '@/modules/shared/components/PmsProvider.vue'
}

Get-ChildItem -Path "apps/admin/src" -Recurse -Include "*.vue","*.js" | ForEach-Object {
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

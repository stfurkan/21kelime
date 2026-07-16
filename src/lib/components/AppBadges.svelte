<!-- Store badges for the web start screen. The App Store one links out;
     Google Play shows as coming soon until the Play launch. -->
<div class="badges">
	<a
		class="badge"
		href="https://apps.apple.com/tr/app/id6791340807"
		target="_blank"
		rel="noopener noreferrer"
		aria-label="App Store'dan indir"
	>
		<svg viewBox="0 0 384 512" width="22" height="22" fill="currentColor" aria-hidden="true">
			<path
				d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
			/>
		</svg>
		<span class="lines"><small>App Store'dan</small><strong>İndirin</strong></span>
	</a>
	<div class="badge soon" title="Google Play sürümü hazırlanıyor">
		<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
			<path d="M4 3.5v17c0 .4.5.7.8.4l9.2-8.2c.2-.2.2-.5 0-.7L4.8 3.1c-.3-.3-.8 0-.8.4z" />
			<path d="M14.9 9.4 6.7 2.2l11.2 6.3-3 .9zM14.9 14.6l3 .9-11.2 6.3 8.2-7.2z" opacity="0.55" />
			<path d="M15.9 10.1l3.8 2.1c.4.2.4.8 0 1l-3.8 2.1-1.7-2.6 1.7-2.6z" opacity="0.75" />
		</svg>
		<span class="lines"><small>Google Play'de</small><strong>Yakında</strong></span>
	</div>
</div>

<style>
	.badges {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 0.6rem;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		background: #101010;
		color: #ffffff;
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 0.4rem 0.85rem 0.45rem;
		line-height: 1.1;
	}

	a.badge:hover {
		text-decoration: none;
	}

	@media (hover: hover) {
		a.badge:hover {
			border-color: var(--accent);
		}
	}

	.lines {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
	}

	.lines small {
		font-size: 0.58rem;
		letter-spacing: 0.01em;
		opacity: 0.85;
	}

	.lines strong {
		font-size: 0.98rem;
		font-weight: 700;
	}

	.soon {
		opacity: 0.55;
		cursor: default;
	}
</style>

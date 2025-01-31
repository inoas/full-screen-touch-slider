'use strict'
const spawnSliderOn = function (baseSelector) {
	document.querySelectorAll(baseSelector).forEach(function (baseElem) {
		console.log(`Spawning slider on: ${baseSelector} / id: ${baseElem.id} / classes: ${Array.from(baseElem.classList.values()).join(' ')} `);

		// get our elements
		const slider = baseElem.querySelector(`.slider-container`),
			slides = Array.from(baseElem.querySelectorAll(`.slider-container .slide`))

		const horizontalSensitivity = 100,
			verticalSensitivity = 5,
			nextSlideWaitingTime = 750

		// set up our state
		let isDragging = false,
			startPos = 0,
			currentTranslate = 0,
			prevTranslate = 0,
			animationID,
			currentIndex = 0,
			cumulativeHorizontalScrollDelta = 0,
			allowScrollEventPropagation = true

		// Add event listeners for clicks
		const sliderPrevControl = baseElem.querySelector(`.slider-controls .slider-prev-control`)
		const sliderNextControl = baseElem.querySelector(`.slider-controls .slider-next-control`)

		if (sliderPrevControl !== null) {
			sliderPrevControl.addEventListener('click', goPrev)
		}
		if (sliderNextControl !== null) {
			sliderNextControl.addEventListener('click', goNext)
		}

		if (slides.length >= 2) {
			sliderNextControl.disabled = false
		}

		// add our event listeners
		slides.forEach((slide, index) => {
			const slideContents = slide.querySelector('.slide-contents')
			// disable default image drag
			slideContents.addEventListener('dragstart', function (event) { event.preventDefault() })
			if (slides.length >= 2) {
				// touch events
				slide.addEventListener('touchstart', touchStart(index))
				slide.addEventListener('touchend', touchEnd)
				slide.addEventListener('touchmove', touchMove)
				// mouse events
				slide.addEventListener('mousedown', touchStart(index))
				slide.addEventListener('mouseup', mouseUp)
				slide.addEventListener('mousemove', touchMove)
				slide.addEventListener('mouseleave', mouseLeave)
				// horizontal mouse wheel / touch pad slide events
				slide.addEventListener('wheel', scrollEnd)
			}
		})

		// make responsive to viewport changes
		window.addEventListener('resize', setPositionByIndex)

		// prevent menu popup on long press
		slider.oncontextmenu = function (event) {
			event.preventDefault()
			event.stopPropagation()
			return false
		}

		function getPositionX(event) {
			return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX
		}

		function goPrev(event) {
			event.preventDefault()
			event.stopPropagation()
			if (currentIndex > 0) {
				currentIndex -= 1
				setPositionByIndex(true)
			}
			return false
		}

		function goNext(event) {
			event.preventDefault()
			event.stopPropagation()
			if (currentIndex < slides.length - 1) {
				currentIndex += 1
				setPositionByIndex(true)
			}
			return false
		}

		// use a HOF so we have index in a closure
		function touchStart(index) {
			return function (event) {
				currentIndex = index
				startPos = getPositionX(event)
				isDragging = true
				animationID = requestAnimationFrame(animation)
				slider.classList.add('grabbing')
			}
		}

		function touchMove(event) {
			if (isDragging) {
				const currentPosition = getPositionX(event)
				currentTranslate = prevTranslate + currentPosition - startPos
			}
		}

		function scrollEnd(event) {
			let result = true
			if (Math.abs(event.deltaY) < verticalSensitivity) {
				result = false
				event.preventDefault()
				event.stopPropagation()
				cumulativeHorizontalScrollDelta += event.deltaX
			}
			if (allowScrollEventPropagation === false) {
				cumulativeHorizontalScrollDelta = 0
			} else if (Math.abs(cumulativeHorizontalScrollDelta) >= horizontalSensitivity) {
				result = false
				event.preventDefault()
				event.stopPropagation()
				allowScrollEventPropagation = false
				if (cumulativeHorizontalScrollDelta >= horizontalSensitivity) {
					if (currentIndex < slides.length - 1) {
						currentIndex += 1
						setPositionByIndex()
					}
				} else if (cumulativeHorizontalScrollDelta <= -horizontalSensitivity) {
					if (currentIndex > 0) {
						currentIndex -= 1
						setPositionByIndex()
					}
				}
				window.setTimeout(function () {
					allowScrollEventPropagation = true
				}, nextSlideWaitingTime)
			}
			return result
		}

		function touchEnd() {
			endGrab()
			setPositionByIndex(false)
		}

		function mouseUp() {
			endGrab()
			setPositionByIndex(true)
		}

		function mouseLeave() {
			endGrab()
		}

		function endGrab() {
			cancelAnimationFrame(animationID)
			isDragging = false
			const movedBy = currentTranslate - prevTranslate

			// if moved enough negative then snap to next slide if there is one
			if (movedBy < -50 && currentIndex < slides.length - 1) {
				currentIndex += 1
			}

			// if moved enough positive then snap to previous slide if there is one
			if (movedBy > 50 && currentIndex > 0) {
				currentIndex -= 1
			}

			slider.classList.remove('grabbing')
		}

		function animation() {
			setSliderPosition()
			if (isDragging) requestAnimationFrame(animation)
		}

		function setPositionByIndex(doScrollIntoView = false) {
			if (sliderPrevControl !== null) {
				if (currentIndex == 0) {
					sliderPrevControl.disabled = true
				} else {
					sliderPrevControl.disabled = false
				}
			}
			if (sliderNextControl !== null) {
				if (currentIndex == slides.length - 1) {
					sliderNextControl.disabled = true
				} else {
					sliderNextControl.disabled = false
				}
			}
			currentTranslate = currentIndex * -window.innerWidth
			prevTranslate = currentTranslate

			setSliderPosition()

			if (doScrollIntoView === true) {
				baseElem.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
			}
		}

		function setSliderPosition() {
			slider.style.transform = `translateX(${currentTranslate}px)`
		}

	});
}

if (typeof exports !== "undefined") {
	exports.spawnSliderOn = function (baseSelector) {
		spawnSliderOn(baseSelector);
	}
}
